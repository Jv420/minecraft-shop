const crypto = require('crypto');
const Stripe = require('stripe');
const { getPool } = require('../lib/db');
const { sendDiscordEmbed } = require('../lib/discord');

function clean(value, max = 180) {
  return String(value || '').trim().slice(0, max);
}

async function ensureTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS license_requests (
      id VARCHAR(40) PRIMARY KEY,
      stripe_session_id VARCHAR(255) NOT NULL UNIQUE,
      customer_name VARCHAR(180) NOT NULL,
      email VARCHAR(255) NOT NULL,
      discord_user_id VARCHAR(40) NULL,
      product VARCHAR(80) NOT NULL,
      instance_id VARCHAR(255) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      license_key VARCHAR(120) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approved_at TIMESTAMP NULL,
      INDEX idx_license_requests_status (status)
    )
  `);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sessionId = clean(req.body?.sessionId, 255);
    const customerName = clean(req.body?.customerName);
    const email = clean(req.body?.email, 255);
    const discordUserId = clean(req.body?.discordUserId, 40);
    const product = clean(req.body?.product, 80);
    const instanceId = clean(req.body?.instanceId, 255);

    if (!sessionId || !customerName || !email || !product || !instanceId) {
      return res.status(400).json({ error: 'Vul alle verplichte velden in' });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Ongeldig e-mailadres' });
    }

    const allowedProducts = new Set(['DYNASTORE-WEB', 'DYNASTORE-PLUGIN', 'DYNASTORE-BUNDLE']);
    if (!allowedProducts.has(product)) {
      return res.status(400).json({ error: 'Ongeldig product' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'De Stripe-betaling is nog niet voltooid' });
    }

    const paidProduct = clean(session.metadata?.licenseProduct || session.metadata?.product || '', 80);
    if (paidProduct && paidProduct !== product) {
      return res.status(400).json({ error: 'Aangevraagd product komt niet overeen met de betaling' });
    }

    await ensureTable();
    const pool = getPool();
    const requestId = `LR-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    await pool.query(
      `INSERT INTO license_requests
       (id, stripe_session_id, customer_name, email, discord_user_id, product, instance_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [requestId, sessionId, customerName, email, discordUserId || null, product, instanceId]
    );

    await sendDiscordEmbed({
      title: '🔐 Nieuwe licentieaanvraag',
      description: 'Een betaalde klant heeft een licentie aangevraagd.',
      color: 10181046,
      fields: [
        { name: 'Aanvraag', value: requestId, inline: true },
        { name: 'Product', value: product, inline: true },
        { name: 'Klant', value: customerName, inline: true },
        { name: 'E-mail', value: email, inline: false },
        { name: 'Discord ID', value: discordUserId || 'Niet opgegeven', inline: true },
        { name: 'Instance', value: instanceId, inline: true },
        { name: 'Stripe sessie', value: `\`${sessionId}\``, inline: false }
      ]
    });

    return res.status(201).json({ requestId, status: 'pending' });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Voor deze betaling bestaat al een licentieaanvraag' });
    }
    console.error(error);
    return res.status(500).json({ error: error.message || 'Licentieaanvraag kon niet worden opgeslagen' });
  }
};
