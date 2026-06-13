const crypto = require('crypto');
const products = require('../../lib/products');
const { createManualOrder } = require('../../lib/orders');
const { sendDiscordEmbed } = require('../../lib/discord');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-plugin-secret'];
  if (!secret || secret !== process.env.PLUGIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { player, productId = 'live_test_bundle', actor = 'PowerShell DB test' } = req.body || {};
    const product = products[productId];

    if (!product) {
      return res.status(404).json({ error: 'Product niet gevonden' });
    }

    if (!/^[a-zA-Z0-9_\.]{3,16}$/.test(String(player || ''))) {
      return res.status(400).json({ error: 'Ongeldige Minecraft spelernaam' });
    }

    const orderId = `dbtest_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const commands = product.commands.map(command =>
      command.replaceAll('{player}', player).replaceAll('{PLAYER}', player)
    );

    const order = await createManualOrder({
      id: orderId,
      player,
      productId,
      productName: `[DB TEST] ${product.name}`,
      commands,
      message: `Database testorder aangemaakt door ${actor}`
    });

    await sendDiscordEmbed({
      title: '🧪 Database testorder aangemaakt',
      description: 'Er is zonder Stripe-betaling een testorder in MySQL geplaatst.',
      color: 10181046,
      fields: [
        { name: 'Speler', value: player, inline: true },
        { name: 'Product', value: product.name, inline: true },
        { name: 'Order', value: `\`${orderId}\``, inline: false },
        { name: 'Status', value: 'pending_delivery', inline: true }
      ]
    });

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('DB test order error:', error);
    return res.status(500).json({
      error: 'Database testorder aanmaken mislukt',
      details: error.message,
      code: error.code || null
    });
  }
};
