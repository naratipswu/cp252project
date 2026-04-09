const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Equipment = sequelize.define('Equipment', {
  ModelName: { type: DataTypes.STRING, allowNull: false },
  Brand: { type: DataTypes.STRING },
  SerialNumber: { type: DataTypes.STRING },
  DailyRate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  ImageURL: { type: DataTypes.STRING },
  Status: { 
    type: DataTypes.ENUM('available', 'rented', 'maintenance'), 
    defaultValue: 'available' 
  }
});

module.exports = Equipment;
