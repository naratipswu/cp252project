const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Rental = sequelize.define('Rental', {
  RentalDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  TotalAmount: { type: DataTypes.DECIMAL(10, 2) },
  RentalStatus: { 
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'), 
    defaultValue: 'pending' 
  }
});

module.exports = Rental;
