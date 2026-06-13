const Stripe = require('stripe');
const { getOrder } = require('../lib/orders');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionId = String(req.query?.session_id || '');
  if (!sessionId.startsWith('cs_')) {
    return res.status(400).json({ error: 'Ongeldige Stripe sessie' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const order = await getOrder(sessionId);

    return res.status(200).json({
      sessionId,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email || null,
      player: session.metadata?.player || order?.player || null,
      productId: session.metadata?.productId || order?.productId || null,
      orderStatus: order?.status || null,
      orderMessage: order?.message || null,
      delivered: order?.status === 'delivered'
    });
  } catch (error) {
    console.error('Order status error:', error);
    return res.status(500).json({
      error: 'Status ophalen mislukt',
      details: error.message
    });
  }
};
