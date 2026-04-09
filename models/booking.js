const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Booking = sequelize.define('Booking', {
  start_date: { type: DataTypes.DATEONLY, allowNull: false },
  end_date: { type: DataTypes.DATEONLY, allowNull: false },
  total_price: { type: DataTypes.DECIMAL(10, 2) },
  status: { 
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'), 
    defaultValue: 'pending' 
  }
});

module.exports = Booking;