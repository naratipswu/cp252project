const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Category = sequelize.define('Category', {
  CategoryName: { type: DataTypes.STRING, allowNull: false }
});

module.exports = Category;
