const { getOrder } = require('../lib/orders');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-debug-secret'];
  if (!secret || secret !== process.env.PLUGIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const orderId = req.query?.id;
  if (!orderId) {
    return res.status(400).json({ error: 'Missing id query parameter' });
  }

  try {
    const order = await getOrder(orderId);
    return res.status(200).json({ order });
  } catch (error) {
    return res.status(500).json({ error: error.message, code: error.code || null });
  }
};
