const { Sequelize } = require('sequelize');

const dialect = process.env.DB_DIALECT || 'sqlite';

function buildConfig() {
  if (dialect === 'postgres') {
    if (process.env.NODE_ENV === 'production' && !process.env.DB_NAME) {
      throw new Error('DB_NAME is required for postgres in production');
    }

    return {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || 'camera_rental',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      dialect: 'postgres',
      logging: false
    };
  }

  return {
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: false
  };
}

const sequelize = new Sequelize(buildConfig());

module.exports = sequelize;