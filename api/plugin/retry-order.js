const { retryOrder } = require('../../lib/orders');
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
    const { orderId, actor } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId ontbreekt' });

    const order = await retryOrder(orderId);
    if (!order) return res.status(409).json({ error: 'Order kan niet opnieuw aangeboden worden' });

    await sendDiscordEmbed({
      title: '🔄 Order handmatig opnieuw aangeboden',
      description: 'Een beheerder heeft een mislukte of vastgelopen order opnieuw in de leveringswachtrij gezet.',
      color: 16753920,
      fields: [
        { name: 'Beheerder', value: String(actor || 'onbekend'), inline: true },
        { name: 'Speler', value: order.player, inline: true },
        { name: 'Product', value: order.productName, inline: true },
        { name: 'Order', value: `\`${order.id}\``, inline: false }
      ]
    });

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ error: 'Retry mislukt', details: error.message });
  }
};
