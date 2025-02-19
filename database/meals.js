const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const User = require('./Users')

const Meal = sequelize.define('Meal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dia: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  tipo_refeicao: {
    type: DataTypes.STRING,
    allowNull: false
    }
}, {
    timestamps: false //Impede que Sequelize tente usar `createdAt` e `updatedAt`
});
Meal.belongsTo(User, { foreignKey: "user_id", as: "usuario" });

module.exports = Meal;
