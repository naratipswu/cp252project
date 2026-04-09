const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Category = sequelize.define('Category', {
  CategoryID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  CategoryName: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'Category',
  timestamps: false
});

module.exports = Category;
