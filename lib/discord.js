async function sendDiscordEmbed(payload) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  const body = {
    username: 'DynathiSMP Store',
    embeds: [{
      title: payload.title,
      description: payload.description || '',
      color: payload.color || 3447003,
      fields: payload.fields || [],
      timestamp: new Date().toISOString(),
      footer: { text: 'DynathiSMP Webshop' }
    }]
  };

  await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function money(amount, currency) {
  return `${(amount / 100).toFixed(2)} ${String(currency || 'eur').toUpperCase()}`;
}

module.exports = { sendDiscordEmbed, money };
