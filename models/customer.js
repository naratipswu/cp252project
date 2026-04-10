const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Customer = sequelize.define('Customer', {
  CustomerID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  FirstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  LastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Username: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  Email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  PasswordHash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  Role: {
    type: DataTypes.ENUM('user', 'admin'),
    allowNull: false,
    defaultValue: 'user'
  },
  AvatarPath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  Address: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'Customer',
  timestamps: false
});

module.exports = Customer;
