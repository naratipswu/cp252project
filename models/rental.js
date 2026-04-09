const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Rental = sequelize.define('Rental', {
  RentalID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  RentalDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  TotalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  RentalStatus: {
    type: DataTypes.ENUM('pending', 'active', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  CustomerID: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Rental',
  timestamps: false
});

module.exports = Rental;
