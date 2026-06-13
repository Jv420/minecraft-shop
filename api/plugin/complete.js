const { completeOrder } = require('../../lib/orders');
const { sendDiscordEmbed } = require('../../lib/discord');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = req.headers['x-plugin-secret'];
  if (!secret || secret !== process.env.PLUGIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { orderId, player, productName, status, message } = req.body || {};
    if (!orderId || !['delivered', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Ongeldige delivery status' });
    }

    const order = await completeOrder(orderId, status, message);
    if (!order) return res.status(404).json({ error: 'Order niet gevonden' });

    await sendDiscordEmbed({
      title: status === 'delivered' ? '✅ Product geleverd' : '❌ Delivery mislukt',
      description: status === 'delivered'
        ? 'De Paper-plugin heeft de aankoop succesvol uitgevoerd.'
        : 'De Paper-plugin kon één of meer commands niet uitvoeren.',
      color: status === 'delivered' ? 5763719 : 15548997,
      fields: [
        { name: 'Speler', value: String(player || order.player || 'onbekend'), inline: true },
        { name: 'Product', value: String(productName || order.productName || 'onbekend'), inline: true },
        { name: 'Order', value: `\`${orderId}\``, inline: false },
        { name: 'Details', value: String(message || 'Geen details').slice(0, 1000), inline: false }
      ]
    });

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Plugin complete error:', error);
    return res.status(500).json({ error: 'Orderstatus bijwerken mislukt' });
  }
};
