const Stripe = require('stripe');
const products = require('../lib/products');
const { requestDelivery } = require('../lib/delivery');
const { sendDiscordEmbed, money } = require('../lib/discord');

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
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

      if (!product) {
        await sendDiscordEmbed({
          title: '⚠️ Betaald maar product onbekend',
          description: 'Stripe betaling is gelukt, maar het product bestaat niet in lib/products.js.',
          color: 16753920,
          fields: [
            { name: 'Stripe sessie', value: `\`${session.id}\``, inline: false },
            { name: 'Product ID', value: String(productId || 'onbekend'), inline: true },
            { name: 'Speler', value: String(player || 'onbekend'), inline: true }
          ]
        });
        return res.status(200).json({ received: true });
      }

      await sendDiscordEmbed({
        title: '💰 Betaling gelukt',
        description: 'Stripe heeft de betaling bevestigd. Delivery wordt gestart.',
        color: 5763719,
        fields: [
          { name: 'Speler', value: player, inline: true },
          { name: 'Product', value: product.name, inline: true },
          { name: 'Bedrag', value: money(product.price, product.currency), inline: true },
          { name: 'Stripe sessie', value: `\`${session.id}\``, inline: false }
        ]
      });

      try {
        const delivery = await requestDelivery({
          orderId: session.id,
          productId,
          player,
          amount: product.price,
          currency: product.currency
        });

        if (delivery.delivered) {
          await sendDiscordEmbed({
            title: '✅ Product geleverd',
            description: 'De aankoop is succesvol via de RCON-agent uitgevoerd.',
            color: 5763719,
            fields: [
              { name: 'Speler', value: player, inline: true },
              { name: 'Product', value: product.name, inline: true },
              { name: 'Order', value: `\`${session.id}\``, inline: false }
            ]
          });
        }
      } catch (deliveryError) {
        await sendDiscordEmbed({
          title: '❌ Delivery mislukt',
          description: 'Betaling is gelukt, maar de RCON delivery is mislukt.',
          color: 15548997,
          fields: [
            { name: 'Speler', value: String(player || 'onbekend'), inline: true },
            { name: 'Product', value: product.name, inline: true },
            { name: 'Order', value: `\`${session.id}\``, inline: false },
            { name: 'Fout', value: `\`${deliveryError.message}\``, inline: false }
          ]
        });
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      await sendDiscordEmbed({
        title: '⌛ Checkout verlopen',
        description: 'Een speler heeft de betaling niet afgerond.',
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
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
};

module.exports.config = { api: { bodyParser: false } };
