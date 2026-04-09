const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Return = sequelize.define('Return', {
  ReturnID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ActualReturnDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  LateFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  DamageFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  Notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  RentalDetailID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'Return',
  timestamps: false
});

module.exports = Return;
