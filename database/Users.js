const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const bcrypt = require('bcryptjs');

const user = sequelize.define('user', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    vaidate:{
      is: /^[a-zA-Z0-9_]+$/ //só permite letras, números e _
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nome_pg:{
    type: DataTypes.STRING,
    allowNull : true,
    unique: false
  }
}, {
    timestamps: false // Impede que Sequelize tente usar `createdAt` e `updatedAt`
});
{
  hooks: {
    beforeCreate: async (user) => {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
  }};

user.associate = (models) => {
  user.hasMany(models.Meal, {
    foreignKey: 'user_id',
    as: "refeicoes",
    onDelete: 'CASCADE' // Opcional: deleta refeições se usuário for removido
  });
};

module.exports = user;