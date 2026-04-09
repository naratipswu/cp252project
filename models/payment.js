const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define('Payment', {
  PaymentID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  PaymentMethod: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  PaymentDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  RentalID: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Payment',
  timestamps: false
});

module.exports = Payment;