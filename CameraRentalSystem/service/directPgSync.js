const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
      port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
      database: process.env.PGDATABASE || process.env.DB_NAME || 'postgres',
      user: process.env.PGUSER || process.env.DB_USER || 'postgres',
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD || ''
    });
  }
  return pool;
}

async function upsertCustomerDirectPg(user) {
  const username = String(user.username || 'User').trim();
  const chunks = username.split(/\s+/).filter(Boolean);
  const firstName = String(user.firstName || chunks[0] || 'User').trim();
  const lastName = String(user.lastName || (chunks.length > 1 ? chunks.slice(1).join(' ') : 'User')).trim();
  const phone = String(user.phone || '0000000000').trim();
  const address = String(user.address || 'Created from app registration').trim();
  const email = String(user.email || `${username}@legacy.local`).toLowerCase();

  const sql = `
    INSERT INTO "Customer" ("FirstName", "LastName", "Phone", "Email", "Address")
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT ("Email")
    DO UPDATE SET
      "FirstName" = EXCLUDED."FirstName",
      "LastName" = EXCLUDED."LastName",
      "Phone" = EXCLUDED."Phone",
      "Address" = EXCLUDED."Address"
  `;

  try {
    await getPool().query(sql, [firstName, lastName, phone, email, address]);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  upsertCustomerDirectPg
};
