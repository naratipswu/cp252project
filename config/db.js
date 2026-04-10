const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Sequelize } = require('sequelize');

const dialect = String(process.env.DB_DIALECT || 'postgres').toLowerCase();
if (dialect !== 'postgres') {
  throw new Error('This project is configured for Postgres-only mode (set DB_DIALECT=postgres).');
}

const isTest = String(process.env.NODE_ENV || '').toLowerCase() === 'test';
if (isTest) {
  process.env.DB_NAME = process.env.DB_NAME || 'camera_rental_test';
  process.env.DB_USER = process.env.DB_USER || 'postgres';
}

if (!process.env.DB_NAME) {
  throw new Error('DB_NAME is required (e.g. camera_rental).');
}
if (!process.env.DB_USER) {
  throw new Error('DB_USER is required.');
}

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  dialect: 'postgres',
  logging: false
});

module.exports = sequelize;