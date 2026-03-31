const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Payment = sequelize.define('Payment', {
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  method: { type: DataTypes.STRING }, // เช่น 'โอนเงิน', 'บัตรเครดิต'
  status: { type: DataTypes.ENUM('unpaid', 'paid'), defaultValue: 'unpaid' }
});

module.exports = Payment;