const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Camera = sequelize.define('Camera', {
  model_name: { type: DataTypes.STRING, allowNull: false },
  brand: { type: DataTypes.STRING },
  daily_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { 
    type: DataTypes.ENUM('available', 'rented', 'maintenance'), 
    defaultValue: 'available' 
  }
});

module.exports = Camera;