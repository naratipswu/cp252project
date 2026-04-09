const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Equipment = sequelize.define('Equipment', {
  EquipmentID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ModelName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Brand: {
    type: DataTypes.STRING,
    allowNull: false
  },
  SerialNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  DailyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  ImageURL: {
    type: DataTypes.STRING,
    allowNull: true
  },
  Status: {
    type: DataTypes.ENUM('available', 'rented', 'maintenance'),
    allowNull: false,
    defaultValue: 'available'
  },
  CategoryID: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Equipment',
  timestamps: false
});

module.exports = Equipment;
