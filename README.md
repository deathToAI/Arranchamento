# Sistema simples de arranchamento(Agendamento de refeições em Organizações Militares)

Site simples cuja finalidade inicial era de aprendizados através da prática em javascript usando Node JS e Express.
Com o tempo tornou-se uma alternativa viável ao arranchamento por papel ainda utilizado em diversas OM. A ideia é que seja simples de iplementar ao seguir a documentação, sendo executável mesmo por quem tem pouco conhecimento na área.
O planejamento futuro inclui torná-lo código aberto para utilização por qualquer pessoa que, veja nele, alguma utilidade prática.

Roadmap no link:
https://docs.google.com/spreadsheets/d/1z5NmnJATzEPpEQPOHimKT3pm-_SJkcGASERZba-VgAQ/edit?gid=0#gid=0

O projeto não tem nenhuma finalidade comercial ou lucro de qualquer natureza por parte do(s) desenvolvedor(es) e colaborador(es).

**Desenvolvido para facilitar o gerenciamento de arranchamento e diminuir a dependência de sistemas arcaicos dependentes unicamente de input humano e de infindáveis resmas de papel!** 

# 📜 Manual de Instalação e Uso - Sistema de Arranchamento

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

## 🚀 Tecnologias Utilizadas
- **Backend**: Node.js + Express.js
- **Banco de Dados**: SQLite + Sequelize ORM
- **Frontend**: HTML, CSS e JavaScript puro
- **Autenticação**: JWT (JSON Web Token) + Bcrypt para hash de senhas
- **Relatórios**: ExcelJS e PDFKit para geração de relatórios em XLSX e PDF

---

## 📥 Instalação

### 🏗️ 1. Clonar o repositório
```sh
git clone https://github.com/seu-usuario/sistema-arranchamento.git
cd sistema-arranchamento
```

### 📦 2. Instalar dependências
```sh
npm install
```

### ⚙️ 3. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto e configure:
```ini
JWT_SECRET=sua_chave_secreta

ARR_DB=/caminho/para/database.sqlite #Mudança de local de database não foi implementada no projeto original mas é altamente recomendado
```

Caso use **outro caminho** para o banco SQLite, edite o `database.js` e defina `storage: process.env.ARR_DB`.

## ▶️ Executando o Sistema

###  Iniciar o Servidor
```sh
npm start
```
O servidor estará rodando na porta `3000` por padrão.

### 📍 Acessar a Aplicação
Abra no navegador:
```
http://localhost:3000
```

## É recomendado verificar a pasta Utils para criação e importação de usuários em massa usando o shell scrip e csv lá contidos.
---

## 🔑 Usuários Padrão e Acesso

### 🎖️ **Usuário Administrador**
- **Login**: `Admin`
- **Senha**: `C@mole`
- **Função**: Gerencia usuários, pode criar/remover usuários e redefinir senhas.

### 🏅 **Usuário Furriel**
- **Login**: `furriel`
- **Função**: Responsável por cadastrar militares nas refeições.

### 📝 **Usuário Aprovisionador**
- **Login**: `aprov`
- **Função**: Gera relatórios e aprova refeições.

---

## 📑 Estrutura do Projeto

```
📂 sistema-arranchamento
│── 📂 database        # Banco de dados e modelos Sequelize
│   │── database.js    # Configuração do Sequelize
│   ├── 📂 models
│   │   ├── admin.js   # Modelo Admin (Administrador)
│   │   ├── meals.js   # Modelo Meals (Refeições)
│   │   ├── users.js   # Modelo Users (Usuários)
│
│── 📂 public          # Arquivos estáticos (HTML, imagens, CSS)
│   ├── aprov.html     # Página de aprovação
│   ├── dashboard.html # Dashboard principal
│   ├── furriel_dashboard.html # Painel do Furriel
│   ├── nidma.html     # Página do Administrador
│   ├── img/
│
│── 📂 static          # Arquivos JS do frontend
│   ├── aprov.js       # Lógica da página de aprovação
│   ├── dashboard.js   # Lógica do dashboard
│   ├── furriel.js     # Lógica do Furriel
│   ├── nidma.js       # Lógica da página de administração
│   ├── scripts.js     # Scripts globais
│   ├── styles.css     # Estilos
│
│── 📂 Utils           # Scripts auxiliares
│   ├── cripto.js      # Funções de criptografia
│   ├── importar_usuarios.sh # Importação em massa
│
│── .env               # Configurações de ambiente (não deve ser commitado)
│── server.js          # Servidor principal Node.js
│── package.json       # Dependências do projeto
│── README.md          # Documentação inicial (este arquivo)
```

---

## ⚡ Funcionalidades

✅ **Autenticação JWT**: Apenas usuários logados podem acessar páginas restritas.  
✅ **Cadastro de refeições**: Usuários podem marcar/desmarcar refeições.  
✅ **Geração de relatórios**: Exportação de dados para **Excel (XLSX)** e **PDF**.  
✅ **Gerenciamento de usuários**: Criar, remover e resetar senhas pelo painel de admin.  
✅ **Controle de Acesso**: Furriel não pode acessar Aprovisionador e vice-versa.  

---

## 🔧 Comandos Úteis

### 📌 Iniciar em produção com **PM2**
```sh
pm install -g pm2
pm run build
pm run start
```
> Isso mantém o servidor rodando em background.

### 📌 Parar o servidor
```sh
pm stop
```

### 📌 Reiniciar após atualização
```sh
git pull origin main
pm restart
```

---

## ❓ Suporte
Caso tenha dúvidas ou precise de ajuda, abra uma **Issue** no repositório ou entre em contato com o desenvolvedor responsável.

---
