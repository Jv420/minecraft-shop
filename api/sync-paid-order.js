const Stripe = require('stripe');
const products = require('../lib/products');
const { createPaidOrder, getOrder } = require('../lib/orders');
const { sendDiscordEmbed, money } = require('../lib/discord');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionId = String(req.body?.session_id || '');
    if (!sessionId.startsWith('cs_')) {
      return res.status(400).json({ error: 'Ongeldige Stripe sessie' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(409).json({ error: 'Sessie is nog niet betaald', paymentStatus: session.payment_status });
    }

    const existing = await getOrder(session.id);
    if (existing) {
      return res.status(200).json({ synced: false, reason: 'already_exists', order: existing });
    }

    const productId = session.metadata?.productId;
    const player = session.metadata?.player;
    const product = products[productId];

    if (!product) {
      return res.status(404).json({ error: 'Product niet gevonden', productId });
    }

    if (!/^[a-zA-Z0-9_\.]{3,16}$/.test(String(player || ''))) {
      return res.status(400).json({ error: 'Ongeldige spelernaam in Stripe metadata' });
    }

    const commands = product.commands.map(command =>
      command.replaceAll('{player}', player).replaceAll('{PLAYER}', player)
    );

    const result = await createPaidOrder({
      id: session.id,
      paymentIntentId: String(session.payment_intent || ''),
      player,
      productId,
      productName: product.name,
      amount: session.amount_total ?? product.price,
      currency: session.currency || product.currency,
      commands
    });

    if (result.created) {
      await sendDiscordEmbed({
        title: '🛠️ Betaalde order hersteld',
        description: 'Een betaalde Stripe-sessie ontbrak in MySQL en is via de succespagina alsnog toegevoegd.',
        color: 16753920,
        fields: [
          { name: 'Speler', value: player, inline: true },
          { name: 'Product', value: product.name, inline: true },
          { name: 'Bedrag', value: money(session.amount_total ?? product.price, session.currency || product.currency), inline: true },
          { name: 'Order', value: `\`${session.id}\``, inline: false },
          { name: 'Status', value: 'pending_delivery', inline: true }
        ]
      });
    }

    return res.status(200).json({ synced: result.created, reason: result.reason || null, order: result.order || null });
  } catch (error) {
    console.error('Sync paid order error:', error);
    return res.status(500).json({
      error: 'Betaalde order synchroniseren mislukt',
      details: error.message,
      code: error.code || null
    });
  }
};
