#!/bin/bash

# Arquivos de entrada e saída
INPUT_FILE="usuarios.csv"
OUTPUT_FILE="usuarios_cripto.csv"
CRIPTO_SCRIPT="cripto.js"

# Cabeçalho do novo arquivo
echo "username,password,user_pg" > "$OUTPUT_FILE"

# Lê o arquivo CSV linha por linha, ignorando o cabeçalho
tail -n +2 "$INPUT_FILE" | while IFS=',' read -r username password user_pg; do
    # Chama o script Node.js para criptografar a senha
    echo "Critpografando $username":
    hashed_password=$(node "$CRIPTO_SCRIPT" "$password")

    # Escreve no novo arquivo CSV
    echo "$username,$hashed_password,$user_pg" >> "$OUTPUT_FILE"
done

echo "Processamento concluído! Arquivo '$OUTPUT_FILE' gerado."
