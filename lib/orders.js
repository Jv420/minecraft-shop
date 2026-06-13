const { getPool, ensureSchema } = require('./db');

function mapRow(row) {
  return {
    id: row.id,
    paymentIntentId: row.payment_intent_id,
    player: row.player,
    productId: row.product_id,
    productName: row.product_name,
    amount: row.amount,
    currency: row.currency,
    commands: JSON.parse(row.commands_json || '[]'),
    status: row.status,
    message: row.message,
    claimedAt: row.claimed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function createPaidOrder(order) {
  await ensureSchema();
  const db = getPool();

  const [result] = await db.execute(
    `INSERT IGNORE INTO minecraft_shop_orders
      (id, payment_intent_id, player, product_id, product_name, amount, currency, commands_json, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_delivery')`,
    [
      order.id,
      order.paymentIntentId || null,
      order.player,
      order.productId,
      order.productName,
      order.amount,
      order.currency,
      JSON.stringify(order.commands || [])
    ]
  );

  if (result.affectedRows === 0) {
    return { created: false, reason: 'already_exists' };
  }

  return { created: true, order: await getOrder(order.id) };
}

async function claimOrders(limit = 10) {
  await ensureSchema();
  const db = getPool();
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 25);

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT * FROM minecraft_shop_orders
       WHERE status = 'pending_delivery'
       ORDER BY created_at ASC
       LIMIT ?
       FOR UPDATE SKIP LOCKED`,
      [safeLimit]
    );

    for (const row of rows) {
      await connection.execute(
        `UPDATE minecraft_shop_orders
         SET status = 'processing', claimed_at = NOW(), updated_at = NOW()
         WHERE id = ? AND status = 'pending_delivery'`,
        [row.id]
      );
    }

    await connection.commit();
    return rows.map(row => ({ ...mapRow(row), status: 'processing' }));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function completeOrder(orderId, status, message) {
  await ensureSchema();
  const db = getPool();

  const [result] = await db.execute(
    `UPDATE minecraft_shop_orders
     SET status = ?, message = ?, updated_at = NOW()
     WHERE id = ?`,
    [status, message || '', orderId]
  );

  if (result.affectedRows === 0) return null;
  return getOrder(orderId);
}

async function getOrder(orderId) {
  await ensureSchema();
  const db = getPool();
  const [rows] = await db.execute(
    'SELECT * FROM minecraft_shop_orders WHERE id = ? LIMIT 1',
    [orderId]
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

async function resetStaleProcessingOrders(minutes = 10) {
  await ensureSchema();
  const db = getPool();
  const safeMinutes = Math.max(Number(minutes) || 10, 1);

  await db.query(
    `UPDATE minecraft_shop_orders
     SET status = 'pending_delivery', claimed_at = NULL, updated_at = NOW()
     WHERE status = 'processing'
       AND claimed_at < DATE_SUB(NOW(), INTERVAL ${safeMinutes} MINUTE)`
  );
}

module.exports = {
  createPaidOrder,
  claimOrders,
  completeOrder,
  getOrder,
  resetStaleProcessingOrders
};
