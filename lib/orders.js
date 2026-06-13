const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();
const QUEUE_KEY = 'dynathi:orders:queue';
const ORDER_PREFIX = 'dynathi:order:';
const PROCESSED_PREFIX = 'dynathi:processed:';

function orderKey(id) {
  return `${ORDER_PREFIX}${id}`;
}

function processedKey(id) {
  return `${PROCESSED_PREFIX}${id}`;
}

async function createPaidOrder(order) {
  const exists = await redis.get(processedKey(order.id));
  if (exists) return { created: false, reason: 'already_processed' };

  const existing = await redis.get(orderKey(order.id));
  if (existing) return { created: false, reason: 'already_queued' };

  const value = {
    ...order,
    status: 'pending_delivery',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await redis.set(orderKey(order.id), value);
  await redis.lpush(QUEUE_KEY, order.id);
  return { created: true, order: value };
}

async function claimOrders(limit = 10) {
  const ids = await redis.lrange(QUEUE_KEY, 0, Math.max(0, limit - 1));
  const orders = [];

  for (const id of ids) {
    const order = await redis.get(orderKey(id));
    if (order && order.status === 'pending_delivery') orders.push(order);
  }

  return orders;
}

async function completeOrder(orderId, status, message) {
  const order = await redis.get(orderKey(orderId));
  if (!order) return null;

  const updated = {
    ...order,
    status,
    message: message || '',
    updatedAt: new Date().toISOString()
  };

  await redis.set(orderKey(orderId), updated);
  await redis.set(processedKey(orderId), status, { ex: 60 * 60 * 24 * 365 });
  await redis.lrem(QUEUE_KEY, 0, orderId);
  return updated;
}

async function getOrder(orderId) {
  return redis.get(orderKey(orderId));
}

module.exports = {
  createPaidOrder,
  claimOrders,
  completeOrder,
  getOrder
};
