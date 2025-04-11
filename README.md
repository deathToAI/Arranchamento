# Arranchamento

# Sistema simples de arranchamento(Agendamento de refeições em Organizações Militares)

Site simples cuja finalidade inicial era de aprendizados através da prática em javascript usando Node JS e Express.
Com o tempo tornou-se uma alternativa viável ao arranchamento por papel ainda utilizado em diversas OM. A ideia é que seja simples de implementar ao seguir a documentação, sendo executável mesmo por quem tem pouco conhecimento na área.
O software é de código aberto para utilização por qualquer pessoa que, veja nele, alguma utilidade prática.

Roadmap no link:
[https://docs.google.com/spreadsheets/d/1z5NmnJATzEPpEQPOHimKT3pm-_SJkcGASERZba-VgAQ/edit?gid=0#gid=0](https://docs.google.com/spreadsheets/d/1z5NmnJATzEPpEQPOHimKT3pm-_SJkcGASERZba-VgAQ/edit?gid=0#gid=0)

O projeto não tem nenhuma finalidade comercial ou lucro de qualquer natureza por parte do(s) desenvolvedor(es) e colaborador(es).

**Desenvolvido para facilitar o gerenciamento de arranchamento e diminuir a dependência de sistemas arcaicos dependentes unicamente de input humano e de infindáveis resmas de papel!**

# Sistema de Arranchamento:
# 📜 [MANUAL DE UTILIZAÇÃO](Manual/Arranchamento_MD.md)

## 📌 Sobre o Projeto
Este projeto é um **Sistema de Arranchamento** desenvolvido em **Node.js** utilizando **Express.js**, **Sequelize** para ORM e banco de dados **SQLite**. Ele permite gerenciar refeições para militares, incluindo funcionalidades de administração para criação, remoção de usuários e redefinição de senhas.

## 🖥️ Ambiente de Desenvolvimento
O sistema foi desenvolvido e testado no seguinte ambiente:

```sh
cat /etc/issue
Linux Mint 22 Wilma \n \l
node -v
v18.19.1
```

```sh
uname -a
Linux factory 6.8.0-38-generic #38-Ubuntu SMP PREEMPT_DYNAMIC Fri Jun  7 15:25:01 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux
```

##  Tecnologias Utilizadas
- **Backend**: Node.js + Express.js
- **Banco de Dados**: SQLite + Sequelize ORM
- **Frontend**: HTML, CSS e JavaScript puro
- **Autenticação**: JWT (JSON Web Token) + Bcrypt para hash de senhas
- **Relatórios**: ExcelJS e PDFKit para geração de relatórios em XLSX e PDF
