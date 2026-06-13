async function sendDiscordEmbed(payload) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.warn('DISCORD_WEBHOOK_URL ontbreekt');
    return { sent: false, reason: 'missing_webhook' };
  }

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

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('Discord webhook error:', response.status, text);
      return { sent: false, status: response.status, body: text };
    }

    return { sent: true };
  } catch (error) {
    console.error('Discord webhook failed:', error.message);
    return { sent: false, reason: error.message };
  }
}

function money(amount, currency) {
  return `${(amount / 100).toFixed(2)} ${String(currency || 'eur').toUpperCase()}`;
}

module.exports = { sendDiscordEmbed, money };
