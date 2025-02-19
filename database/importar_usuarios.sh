#!/bin/bash

# Definição do banco de dados e arquivos CSV
DB_FILE="../database.sqlite"
CSV_FILE="usuarios_cripto.csv"
TABLE_NAME="Users"

# Criar a tabela Users se não existir
sqlite3 "$DB_FILE" <<EOF
CREATE TABLE IF NOT EXISTS $TABLE_NAME (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    nome_pg VARCHAR(255)
);
EOF

echo "Tabela '$TABLE_NAME' verificada/criada no banco de dados '$DB_FILE'."

# Importar os dados do CSV para o SQLite3
tail -n +2 "$CSV_FILE" | while IFS=',' read -r username password nome_pg; do
    sqlite3 "$DB_FILE" <<EOF
INSERT INTO $TABLE_NAME (username, password, nome_pg) VALUES ('$username', '$password', '$nome_pg');
EOF
    echo "Usuário '$username' inserido no banco de dados."
done

echo "Importação concluída!"
