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
    const { productId, player, actor } = req.body || {};
    const product = products[productId];

    if (!product) return res.status(404).json({ error: 'Product niet gevonden' });
    if (!/^[a-zA-Z0-9_\.]{3,16}$/.test(String(player || ''))) {
      return res.status(400).json({ error: 'Ongeldige spelernaam' });
    }

    const orderId = `gift_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const commands = product.commands.map(command =>
      command.replaceAll('{player}', player).replaceAll('{PLAYER}', player)
    );

    const order = await createManualOrder({
      id: orderId,
      player,
      productId,
      productName: `[CADEAU] ${product.name}`,
      commands,
      message: `Handmatig cadeau door ${actor || 'onbekend'}`
    });

    await sendDiscordEmbed({
      title: '🎁 Handmatig cadeau aangemaakt',
      description: 'Een beheerder heeft via de in-game GUI een product cadeau gedaan.',
      color: 10181046,
      fields: [
        { name: 'Beheerder', value: String(actor || 'onbekend'), inline: true },
        { name: 'Speler', value: player, inline: true },
        { name: 'Product', value: product.name, inline: true },
        { name: 'Order', value: `\`${orderId}\``, inline: false }
      ]
    });

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ error: 'Cadeau aanmaken mislukt', details: error.message });
  }
};
