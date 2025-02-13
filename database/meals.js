const { DataTypes } = require('sequelize');
const sequelize = require('./database');

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
      model: 'Users',
      key: 'id'
    }
  },
  tipo_refeicao: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Meal;
