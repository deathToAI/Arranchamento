# Manual do Admin

O painel de admin tem algumas funcionalidades principalmente para suporte simples ao usuário.

A função do admin na maior parte das vezes será criar usuários manulamente(Ler página principal para ver como importar usuários em massa), deletar usuários e resetar senha de utilizadores.

Por vezes, no início pode ser necessário a criação dos usuários especiais do “Grupo 2” como furriel, aprov ou outros que forem julgados necessários.

## Criação de Usuários

1. É o “username” na tabela do banco de dados e login para ser utilizado para entrada
2. Posto/Graduação com o nome de guerra
3. Grupo conforme descrito(É possível adicionar grupos conforme necessário no código fonte)
4. Senha do usuário, que por padrão deve ser a mesma do username. Será salva criptografada com bcrypt no banco de dados.

![image.png](Manual%20do%20Admin/image.png)

## Remoção e alteração de senha de usuário

1. Remover um usuário específico, conforme está escrito. Ele será excluído da base de dados, bem como suas refeições
2. Resetar a senha do usuário, caso o mesmo tenha esquecido. A senha padrão será seu username

![image.png](Manual%20do%20Admin/image%201.png)

## Lista de usuários existentes na base de dados

A lista  é exibida para eventual busca de usuários na base de dados e para fins de depuração

![image.png](Manual%20do%20Admin/image%202.png)
