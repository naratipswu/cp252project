/**
 * PostgreSQL realtime/report mode (disabled by default).
 *
 * Enable when ready:
 *   ENABLE_PG_REALTIME=true
 *   PGHOST=localhost
 *   PGPORT=5432
 *   PGDATABASE=your_db
 *   PGUSER=your_user
 *   PGPASSWORD=your_password
 */
function registerPgRealtimeRoutes(app, requireAdmin) {
  const isEnabled = process.env.ENABLE_PG_REALTIME === 'true';
  if (!isEnabled) return;
  if (typeof requireAdmin !== 'function') {
    throw new Error('registerPgRealtimeRoutes requires an admin middleware');
  }

  // Lazy-load pg only when this feature is enabled.
  // This keeps local app development simple when pg is not installed yet.
  // eslint-disable-next-line global-require
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'camera_rental',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || ''
  });

  const requestCounter = new Map();
  function sqlRateLimit(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const currentMinute = Math.floor(Date.now() / 60000);
    const key = `${ip}:${currentMinute}`;
    const current = requestCounter.get(key) || 0;
    if (current >= 60) {
      return res.status(429).json({ error: 'Too many SQL API requests' });
    }
    requestCounter.set(key, current + 1);
    return next();
  }

  // Health check for pgAdmin/PostgreSQL connectivity.
  app.get('/api/sql/health', requireAdmin, sqlRateLimit, async (req, res) => {
    try {
      const result = await pool.query('SELECT NOW() AS server_time');
      res.json({ ok: true, serverTime: result.rows[0].server_time });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  // Daily revenue report (SQL-first endpoint for classroom demo).
  app.get('/api/sql/revenue-daily', requireAdmin, sqlRateLimit, async (req, res) => {
    try {
      const query = `
        SELECT DATE("PaymentDate") AS pay_day, SUM("Amount")::numeric(10,2) AS total_revenue
        FROM "Payment"
        GROUP BY DATE("PaymentDate")
        ORDER BY pay_day DESC
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Active rentals report.
  app.get('/api/sql/active-rentals', requireAdmin, sqlRateLimit, async (req, res) => {
    try {
      const query = `
        SELECT
          r."RentalID",
          r."RentalDate",
          r."TotalAmount",
          r."RentalStatus",
          c."FirstName",
          c."LastName"
        FROM "Rental" r
        JOIN "Customer" c ON c."CustomerID" = r."CustomerID"
        WHERE r."RentalStatus" IN ('pending', 'active')
        ORDER BY r."RentalDate" DESC
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cleanup pool on shutdown.
  process.on('SIGINT', async () => {
    await pool.end();
    process.exit(0);
  });
}

module.exports = { registerPgRealtimeRoutes };
