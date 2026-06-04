const products = require('./products');
const { sendDiscordEmbed, money } = require('./discord');

function cleanPlayer(player) {
  const value = String(player || '').trim();
  if (!/^[a-zA-Z0-9_\.]{3,16}$/.test(value)) throw new Error('Ongeldige Minecraft naam');
  return value;
}

function productCommands(productId, player) {
  const product = products[productId];
  if (!product) throw new Error('Product niet gevonden');
  return product.commands.map(cmd => cmd.replaceAll('{player}', player).replaceAll('{PLAYER}', player));
}

async function requestDelivery({ orderId, productId, player, amount, currency }) {
  const agentUrl = process.env.RCON_AGENT_URL;
  const secret = process.env.DELIVERY_SECRET;
  const product = products[productId];
  const safePlayer = cleanPlayer(player);
  const commands = productCommands(productId, safePlayer);

  if (!agentUrl || !secret) {
    await sendDiscordEmbed({
      title: '⚠️ Delivery niet ingesteld',
      description: 'Betaling is gelukt, maar RCON_AGENT_URL of DELIVERY_SECRET ontbreekt in Vercel.',
      color: 16753920,
      fields: [
        { name: 'Order', value: `\`${orderId}\``, inline: false },
        { name: 'Speler', value: safePlayer, inline: true },
        { name: 'Product', value: product.name, inline: true },
        { name: 'Bedrag', value: money(amount, currency), inline: true }
      ]
    });
    return { delivered: false, reason: 'RCON agent not configured' };
  }

  const res = await fetch(agentUrl.replace(/\/$/, '') + '/deliver', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-delivery-secret': secret
    },
    body: JSON.stringify({ orderId, player: safePlayer, productId, productName: product.name, commands })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'RCON delivery mislukt');
  return data;
}

module.exports = { cleanPlayer, productCommands, requestDelivery };
