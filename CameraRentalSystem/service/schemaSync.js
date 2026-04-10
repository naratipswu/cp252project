const sequelize = require('../../config/db');
const { DataTypes } = require('sequelize');
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

function normalizeTableName(table) {
  if (typeof table === 'string') return table;
  if (table && typeof table.tableName === 'string') return table.tableName;
  return String(table || '');
}

async function getExistingTablesSet() {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  return new Set(tables.map(normalizeTableName));
}

// eslint-disable-next-line complexity
async function migrateLegacyPostgresTables() {
  const tables = await getExistingTablesSet();
  const hasUsers = tables.has('Users');
  const hasCameras = tables.has('Cameras');
  const hasBookings = tables.has('Bookings');
  const hasPayments = tables.has('Payments');

  // Nothing to migrate.
  if (!hasUsers && !hasCameras && !hasBookings && !hasPayments) return;

  await sequelize.query(`
    INSERT INTO "Category" ("CategoryName")
    VALUES ('General')
    ON CONFLICT DO NOTHING
  `);

  if (hasUsers) {
    await sequelize.query(`
      INSERT INTO "Customer" ("FirstName", "LastName", "Username", "Phone", "Email", "Address")
      SELECT
        COALESCE(NULLIF(TRIM(u."firstName"), ''), COALESCE(NULLIF(TRIM(u."username"), ''), 'User')),
        COALESCE(NULLIF(TRIM(u."lastName"), ''), 'User'),
        u."username",
        COALESCE(NULLIF(TRIM(u."phone"), ''), '0000000000'),
        LOWER(COALESCE(NULLIF(TRIM(u."email"), ''), CONCAT(COALESCE(NULLIF(TRIM(u."username"), ''), 'user'), '@legacy.local'))),
        NULLIF(TRIM(u."address"), '')
      FROM "Users" u
      ON CONFLICT ("Email")
      DO UPDATE SET
        "FirstName" = EXCLUDED."FirstName",
        "LastName" = EXCLUDED."LastName",
        "Username" = EXCLUDED."Username",
        "Phone" = EXCLUDED."Phone",
        "Address" = EXCLUDED."Address"
    `);
  }

  if (hasCameras) {
    await sequelize.query(`
      INSERT INTO "Equipment" ("ModelName", "Brand", "SerialNumber", "DailyRate", "ImageURL", "Status", "CategoryID")
      SELECT
        COALESCE(NULLIF(TRIM(c."model"), ''), 'Unknown'),
        COALESCE(NULLIF(TRIM(c."brand"), ''), 'Unknown'),
        CONCAT('legacy-camera-', c."id"),
        COALESCE(c."pricePerDay", 0),
        c."image",
        CASE WHEN COALESCE(c."stock", 0) > 0 THEN 'available' ELSE 'maintenance' END,
        1
      FROM "Cameras" c
      ON CONFLICT ("SerialNumber")
      DO UPDATE SET
        "ModelName" = EXCLUDED."ModelName",
        "Brand" = EXCLUDED."Brand",
        "DailyRate" = EXCLUDED."DailyRate",
        "ImageURL" = EXCLUDED."ImageURL",
        "Status" = EXCLUDED."Status"
    `);
  }

  if (hasBookings) {
    const bookingCustomerJoinSql = hasUsers
      ? 'JOIN "Users" u ON u."username" = b."user" JOIN "Customer" c ON c."Email" = LOWER(COALESCE(NULLIF(TRIM(u."email"), \'\'), CONCAT(COALESCE(NULLIF(TRIM(u."username"), \'\'), \'user\'), \'@legacy.local\')))'
      : 'JOIN "Customer" c ON c."Email" = LOWER(COALESCE(NULLIF(TRIM(b."user"), \'\'), \'unknown@legacy.local\'))';

    await sequelize.query(`
      INSERT INTO "Rental" ("RentalDate", "TotalAmount", "RentalStatus", "CustomerID")
      SELECT
        COALESCE(b."createdAt", NOW()),
        COALESCE(b."totalPrice", 0),
        CASE
          WHEN b."paymentStatus" = 'cancelled' OR b."bookingStatus" = 'cancelled' THEN 'cancelled'
          WHEN b."paymentStatus" = 'paid' OR b."bookingStatus" = 'completed' THEN 'completed'
          WHEN b."bookingStatus" = 'confirmed' THEN 'active'
          ELSE 'pending'
        END,
        c."CustomerID"
      FROM "Bookings" b
      ${bookingCustomerJoinSql}
      WHERE NOT EXISTS (
        SELECT 1 FROM "Rental" r
        WHERE r."CustomerID" = c."CustomerID"
          AND r."RentalDate" = COALESCE(b."createdAt", NOW())
          AND r."TotalAmount" = COALESCE(b."totalPrice", 0)
      )
    `);

    await sequelize.query(`
      INSERT INTO "RentalDetail" ("RentalID", "EquipmentID", "StartDate", "EndDate", "SubTotal")
      SELECT
        r."RentalID",
        e."EquipmentID",
        b."startDate",
        b."endDate",
        COALESCE(b."totalPrice", 0)
      FROM "Bookings" b
      ${bookingCustomerJoinSql}
      JOIN "Equipment" e ON e."SerialNumber" = CONCAT('legacy-camera-', b."cameraId")
      JOIN "Rental" r ON r."CustomerID" = c."CustomerID"
        AND r."TotalAmount" = COALESCE(b."totalPrice", 0)
        AND r."RentalDate" = COALESCE(b."createdAt", NOW())
      WHERE NOT EXISTS (
        SELECT 1
        FROM "RentalDetail" rd
        WHERE rd."RentalID" = r."RentalID"
          AND rd."EquipmentID" = e."EquipmentID"
          AND rd."StartDate" = b."startDate"
          AND rd."EndDate" = b."endDate"
      )
    `);
  }

  if (hasPayments && hasBookings) {
    const paymentCustomerJoinSql = hasUsers
      ? 'JOIN "Users" u ON u."username" = b."user" JOIN "Customer" c ON c."Email" = LOWER(COALESCE(NULLIF(TRIM(u."email"), \'\'), CONCAT(COALESCE(NULLIF(TRIM(u."username"), \'\'), \'user\'), \'@legacy.local\')))'
      : 'JOIN "Customer" c ON c."Email" = LOWER(COALESCE(NULLIF(TRIM(b."user"), \'\'), \'unknown@legacy.local\'))';

    await sequelize.query(`
      INSERT INTO "Payment" ("RentalID", "PaymentMethod", "Amount", "PaymentDate")
      SELECT
        r."RentalID",
        COALESCE(NULLIF(TRIM(p."PaymentMethod"), ''), 'legacy-payment'),
        COALESCE(p."Amount", 0),
        COALESCE(p."PaymentDate", NOW())
      FROM "Payments" p
      JOIN "Bookings" b ON b."id" = p."BookingID"
      ${paymentCustomerJoinSql}
      JOIN "Rental" r ON r."CustomerID" = c."CustomerID"
        AND r."TotalAmount" = COALESCE(b."totalPrice", 0)
        AND r."RentalDate" = COALESCE(b."createdAt", NOW())
      WHERE NOT EXISTS (
        SELECT 1 FROM "Payment" np
        WHERE np."RentalID" = r."RentalID"
          AND np."Amount" = COALESCE(p."Amount", 0)
          AND np."PaymentDate" = COALESCE(p."PaymentDate", NOW())
      )
    `);
  }
}

async function ensureCustomerAuthColumns() {
  const qi = sequelize.getQueryInterface();
  const columns = await qi.describeTable('Customer');
  const ops = [];

  if (!columns.PasswordHash) {
    ops.push(qi.addColumn('Customer', 'PasswordHash', { type: DataTypes.STRING, allowNull: true }));
  }
  if (!columns.AvatarPath) {
    ops.push(qi.addColumn('Customer', 'AvatarPath', { type: DataTypes.STRING, allowNull: true }));
  }
  if (!columns.Role) {
    ops.push(qi.addColumn('Customer', 'Role', {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user'
    }));
  }

  if (ops.length > 0) {
    await Promise.all(ops);
    // Ensure existing rows have a role.
    await sequelize.query(`UPDATE "Customer" SET "Role" = 'user' WHERE "Role" IS NULL`);
  }
}

async function ensurePaymentSlipColumn() {
  const qi = sequelize.getQueryInterface();
  const columns = await qi.describeTable('Payment');
  if (!columns.SlipPath) {
    await qi.addColumn('Payment', 'SlipPath', { type: DataTypes.STRING, allowNull: true });
  }
}

async function ensureFullSchemaReady() {
  await sequelize.authenticate();

  // Sync in dependency order to avoid FK creation issues.
  const allowAlter = String(process.env.DB_SYNC_ALTER || '').toLowerCase() === 'true';
  const syncOptions = allowAlter ? { alter: true } : {};
  await Category.sync(syncOptions);
  await Equipment.sync(syncOptions);
  await Customer.sync(syncOptions);
  await Rental.sync(syncOptions);
  await RentalDetail.sync(syncOptions);
  await Payment.sync(syncOptions);
  await Return.sync(syncOptions);
  await SyncLog.sync(syncOptions);

  // Guardrail: ensure auth-related columns exist even on older schemas.
  await ensureCustomerAuthColumns();
  await ensurePaymentSlipColumn();

  // If older class schema exists, migrate it into ERD tables.
  await migrateLegacyPostgresTables();
}

module.exports = {
  ensureFullSchemaReady
};
