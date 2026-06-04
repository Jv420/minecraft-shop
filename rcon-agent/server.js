require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const { Rcon } = require('rcon-client');

const app = express();
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

async function runCommands(commands) {
  const rcon = await Rcon.connect({
    host: process.env.RCON_HOST,
    port: Number(process.env.RCON_PORT || 25575),
    password: process.env.RCON_PASSWORD,
    timeout: 10000
  });

  try {
    const results = [];
    for (const command of commands) {
      const response = await rcon.send(command);
      results.push({ command, response });
    }
    return results;
  } finally {
    await rcon.end();
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'dynathismp-rcon-agent' });
});

app.post('/deliver', async (req, res) => {
  try {
    const secret = req.headers['x-delivery-secret'];

    if (!secret || secret !== process.env.DELIVERY_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderId, player, productName, commands } = req.body || {};

    if (!Array.isArray(commands) || commands.length === 0) {
      return res.status(400).json({ error: 'Geen commands ontvangen' });
    }

    const results = await runCommands(commands);

    console.log('Delivered:', orderId, player, productName);

    return res.json({
      delivered: true,
      orderId,
      player,
      productName,
      commandsExecuted: commands.length,
      results
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      delivered: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`DynathiSMP RCON Agent listening on port ${PORT}`);
});
