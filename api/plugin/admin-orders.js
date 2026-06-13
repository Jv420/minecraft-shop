const { listOrders } = require('../../lib/orders');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-plugin-secret'];
  if (!secret || secret !== process.env.PLUGIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const orders = await listOrders(45);
    return res.status(200).json({ orders });
  } catch (error) {
    console.error('Admin orders error:', error);
    return res.status(500).json({ error: 'Orders ophalen mislukt', details: error.message });
  }
};
