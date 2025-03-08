const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const bcrypt = require('bcryptjs');

const Admin = sequelize.define('Admin', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Função para criar usuário Admin se não existir
async function criarAdmin() {
    const senhaPadrao = "C@mole";
    const senhaCriptografada = await bcrypt.hash(senhaPadrao, 10);

    const adminExistente = await Admin.findOne({ where: { username: 'Admin' } });
    if (!adminExistente) {
        await Admin.create({ username: 'Admin', password: senhaCriptografada });
        console.log("Usuário Admin criado com sucesso!");
    } else {
        console.log("Usuário Admin já existe.");
    }
}

// Sincronizar modelo e criar admin
Admin.sync({ alter: true }).then(() => criarAdmin());

module.exports = Admin;
