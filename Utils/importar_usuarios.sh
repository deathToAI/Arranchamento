#!/bin/bash

# Certifique-se de que seu arquivo de entrada usuarios.csv tenha 4 colunas (no seguinte formato:
# username,password,user_pg,grupo)
# O script assume que o Node.js e o SQLite3 estão corretamente
# instalados e configurados.
# Usamos process substitution para evitar que o laço 
# 'while' seja executado em subshell e, assim, manter os contadores.
# Criptografia:

# Lê o arquivo usuarios.csv (sem o cabeçalho) e, para cada linha, criptografa a
# senha chamando o script cripto.js.
# Grava o resultado (com o novo formato) em usuarios_cripto.csv.

# Importação e Atribuição de ID:
# Cria (ou verifica) a tabela Users no banco de dados SQLite,
#  agora incluindo a coluna grupo.
# Inicializa três contadores para os IDs de cada grupo.
# Para cada linha do CSV criptografado, determina o ID a ser usado com
# base no valor da coluna grupo.
# Insere os dados na tabela, informando o ID manualmente.

##OS GRUPOS SÃO 1: OF/STEN/SGT
## GRUPO 2: ADMIN
## GRUPO 3: 

# Arquivos e configurações
INPUT_FILE="usuarios.csv"
OUTPUT_FILE="usuarios_cripto.csv"
CRIPTO_SCRIPT="cripto.js"
DB_FILE="database.sqlite"
TABLE_NAME="Users"

#########################################
# Parte 1: Criptografar as senhas dos usuários
#########################################
echo "Criando o arquivo '$OUTPUT_FILE' com senhas criptografadas..."
# Cria o cabeçalho do arquivo de saída (agora com a coluna grupo)
echo "username,password,user_pg,grupo" > "$OUTPUT_FILE"

# Lê o arquivo CSV de entrada, ignorando o cabeçalho, e processa cada linha
tail -n +2 "$INPUT_FILE" | while IFS=',' read -r username password user_pg grupo; do
    echo "Criptografando usuário: $username"
    # Chama o script Node.js para criptografar a senha
    hashed_password=$(node "$CRIPTO_SCRIPT" "$password")
    
    # Escreve a linha processada no arquivo de saída
    echo "$username,$hashed_password,$user_pg,$grupo" >> "$OUTPUT_FILE"
done

echo "Processamento de criptografia concluído! Arquivo '$OUTPUT_FILE' gerado."

#########################################
# Parte 2: Importar os usuários para o banco de dados SQLite com IDs definidos pelo grupo
#########################################
echo "Verificando/criando a tabela '$TABLE_NAME' no banco de dados '$DB_FILE'..."
sqlite3 "$DB_FILE" <<EOF
CREATE TABLE IF NOT EXISTS $TABLE_NAME (
    id INTEGER PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    nome_pg VARCHAR(255),
    grupo INTEGER
);
EOF

echo "Tabela '$TABLE_NAME' verificada/criada no banco de dados '$DB_FILE'."
echo "Iniciando a importação dos dados do CSV..."

# Inicializa os contadores de ID para cada grupo
counter1=1
counter2=1001
counter3=2000

# Processa o arquivo de saída, evitando que o while rode em subshell
while IFS=',' read -r username password nome_pg grupo; do
    # Pula o cabeçalho
    if [ "$username" == "username" ]; then
        continue
    fi

    # Define o ID com base no grupo
    if [ "$grupo" == "1" ]; then
        id=$counter1
        counter1=$((counter1+1))
    elif [ "$grupo" == "2" ]; then
        id=$counter2
        counter2=$((counter2+1))
    elif [ "$grupo" == "3" ]; then
        id=$counter3
        counter3=$((counter3+1))
    else
        # Se o grupo não for 1, 2 ou 3, define um ID padrão (pode ser tratado como erro)
        id=0
    fi

    # Insere os dados no banco
    sqlite3 "$DB_FILE" <<EOF
INSERT INTO $TABLE_NAME (id, username, password, nome_pg, grupo) VALUES ($id, '$username', '$password', '$nome_pg', $grupo);
EOF

    echo "Usuário '$username' inserido com ID $id."
done < <(tail -n +1 "$OUTPUT_FILE")

echo "Importação concluída!"
