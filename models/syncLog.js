const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SyncLog = sequelize.define('SyncLog', {
  SyncLogID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Source: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'legacy-json'
  },
  Status: {
    type: DataTypes.ENUM('success', 'failed'),
    allowNull: false
  },
  ImportedCameras: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  ImportedCustomers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  ImportedRentals: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  ImportedPayments: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  Message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  SyncedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'SyncLog',
  timestamps: false
});

module.exports = SyncLog;
