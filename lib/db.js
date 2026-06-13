const mysql = require('mysql2/promise');

let pool;
let initialized = false;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    });
  }
  return pool;
}

async function ensureSchema() {
  if (initialized) return;

  const db = getPool();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS minecraft_shop_orders (
      id VARCHAR(255) PRIMARY KEY,
      payment_intent_id VARCHAR(255) NULL,
      player VARCHAR(32) NOT NULL,
      product_id VARCHAR(100) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      amount INT NOT NULL,
      currency VARCHAR(10) NOT NULL,
      commands_json LONGTEXT NOT NULL,
      status ENUM('pending_delivery','processing','delivered','failed') NOT NULL DEFAULT 'pending_delivery',
      message TEXT NULL,
      claimed_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_shop_status_created (status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  initialized = true;
}

module.exports = { getPool, ensureSchema };
