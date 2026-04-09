const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Return = sequelize.define('Return', {
  ActualReturnDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  LateFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  DamageFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  Notes: { type: DataTypes.TEXT }
});

module.exports = Return;
