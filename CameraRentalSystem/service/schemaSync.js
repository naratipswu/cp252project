const sequelize = require('../../config/db');
const {
  Category,
  Equipment,
  Customer,
  Rental,
  RentalDetail,
  Payment,
  Return,
  SyncLog
} = require('../../models');

function usePostgres() {
  return process.env.DB_DIALECT === 'postgres';
}

async function ensureFullSchemaReady() {
  if (!usePostgres()) return;

  await sequelize.authenticate();

  // Sync in dependency order to avoid FK creation issues.
  await Category.sync();
  await Equipment.sync();
  await Customer.sync();
  await Rental.sync();
  await RentalDetail.sync();
  await Payment.sync();
  await Return.sync();
  await SyncLog.sync();
}

module.exports = {
  ensureFullSchemaReady
};
