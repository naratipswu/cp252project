const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RentalDetail = sequelize.define('RentalDetail', {
  StartDate: { type: DataTypes.DATEONLY, allowNull: false },
  EndDate: { type: DataTypes.DATEONLY, allowNull: false },
  SubTotal: { type: DataTypes.DECIMAL(10, 2) }
});

module.exports = RentalDetail;
