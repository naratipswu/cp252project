const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RentalDetail = sequelize.define('RentalDetail', {
  RentalDetailID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  StartDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  EndDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  SubTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  RentalID: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  EquipmentID: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'RentalDetail',
  timestamps: false
});

module.exports = RentalDetail;
