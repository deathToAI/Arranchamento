// Importa a classe Sequelize do pacote 'sequelize'
// Sequelize é um ORM (Object-Relational Mapping) que facilita a interação com bancos de dados relacionais.
const { Sequelize } = require('sequelize');

// Cria uma nova instância do Sequelize, configurando a conexão com o banco de dados.
// Aqui, estamos usando o SQLite como banco de dados.
const sequelize = new Sequelize({
  dialect: 'sqlite', // Define o tipo de banco de dados (neste caso, SQLite)
  storage: './database.sqlite', // Define o caminho do arquivo onde o banco de dados SQLite será armazenado.
  logging: false // Opcional: reduz mensagens de log do Sequelize
  // No SQLite, o banco de dados é armazenado em um único arquivo no sistema de arquivos.
});

// Exporta a instância do Sequelize configurada.
// Isso permite que outros arquivos do projeto (como modelos e scripts) usem a mesma conexão com o banco de dados.
module.exports = sequelize;