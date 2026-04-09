const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Customer = sequelize.define('Customer', {
  FirstName: { type: DataTypes.STRING },
  LastName: { type: DataTypes.STRING },
  Phone: { type: DataTypes.STRING },
  Email: { type: DataTypes.STRING, unique: true, allowNull: false },
  Address: { type: DataTypes.TEXT },
  // Keeping these for App Login Logic
  username: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('customer', 'admin'), defaultValue: 'customer' }
});

module.exports = Customer;
