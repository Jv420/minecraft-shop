const Stripe = require('stripe');
const products = require('../lib/products');
const { cleanPlayer } = require('../lib/delivery');
const { sendDiscordEmbed, money } = require('../lib/discord');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { productId, player } = req.body || {};
    const product = products[productId];
    if (!product) return res.status(404).json({ error: 'Product niet gevonden' });

    const safePlayer = cleanPlayer(player);
    const storeUrl = process.env.STORE_URL || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'ideal', 'bancontact'],
      success_url: `${storeUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${storeUrl}/cancel.html`,
      metadata: { productId: product.id, player: safePlayer },
      line_items: [{
        price_data: {
          currency: product.currency,
          unit_amount: product.price,
          product_data: { name: product.name, description: product.description }
        },
        quantity: 1
      }]
    });

    await sendDiscordEmbed({
      title: '🛒 Checkout gestart',
      description: 'Een speler is begonnen met afrekenen.',
      color: 3447003,
      fields: [
        { name: 'Speler', value: safePlayer, inline: true },
        { name: 'Product', value: product.name, inline: true },
        { name: 'Bedrag', value: money(product.price, product.currency), inline: true },
        { name: 'Stripe sessie', value: `\`${session.id}\``, inline: false }
      ]
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Checkout kon niet worden gestart' });
  }
};
