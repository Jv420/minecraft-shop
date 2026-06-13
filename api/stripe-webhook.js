const Stripe = require('stripe');
const products = require('../lib/products');
const { createPaidOrder } = require('../lib/orders');
const { sendDiscordEmbed, money } = require('../lib/discord');

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('Stripe webhook verified:', event.type, event.id);
  } catch (error) {
    console.error('Webhook signature failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const productId = session.metadata?.productId;
      const player = session.metadata?.player;
      const product = products[productId];

      console.log('Checkout completed:', {
        sessionId: session.id,
        paymentStatus: session.payment_status,
        productId,
        player
      });

      if (session.payment_status !== 'paid') {
        console.warn('Checkout completed but not paid:', session.id, session.payment_status);
        return res.status(200).json({ received: true, queued: false, reason: 'not_paid' });
      }

      if (!product) {
        await sendDiscordEmbed({
          title: '⚠️ Betaald maar product onbekend',
          description: 'Stripe bevestigde de betaling, maar het product bestaat niet in de productconfiguratie.',
          color: 16753920,
          fields: [
            { name: 'Stripe sessie', value: `\`${session.id}\``, inline: false },
            { name: 'Product ID', value: String(productId || 'onbekend'), inline: true },
            { name: 'Speler', value: String(player || 'onbekend'), inline: true }
          ]
        });
        return res.status(200).json({ received: true, queued: false, reason: 'unknown_product' });
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
        amount: product.price,
        currency: product.currency,
        commands
      });

      console.log('Order queue result:', session.id, result);

      if (result.created) {
        await sendDiscordEmbed({
          title: '💰 Betaling gelukt',
          description: 'De betaling is bevestigd en staat klaar voor levering door de Paper-plugin.',
          color: 5763719,
          fields: [
            { name: 'Speler', value: player, inline: true },
            { name: 'Product', value: product.name, inline: true },
            { name: 'Bedrag', value: money(product.price, product.currency), inline: true },
            { name: 'Order', value: `\`${session.id}\``, inline: false },
            { name: 'Status', value: 'pending_delivery', inline: true }
          ]
        });
      }

      return res.status(200).json({ received: true, queued: result.created, reason: result.reason || null });
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      await sendDiscordEmbed({
        title: '⌛ Checkout verlopen',
        description: 'De speler heeft de betaling niet afgerond.',
        color: 16753920,
        fields: [
          { name: 'Speler', value: String(session.metadata?.player || 'onbekend'), inline: true },
          { name: 'Product ID', value: String(session.metadata?.productId || 'onbekend'), inline: true },
          { name: 'Stripe sessie', value: `\`${session.id}\``, inline: false }
        ]
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({
      error: 'Webhook handler failed',
      details: error.message,
      code: error.code || null
    });
  }
};

module.exports.config = { api: { bodyParser: false } };
