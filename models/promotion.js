const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Promotion = sequelize.define('Promotion', {
  code: { type: DataTypes.STRING, unique: true },
  discount_percent: { type: DataTypes.INTEGER },
  expiry_date: { type: DataTypes.DATE }
});

module.exports = Promotion;