const { checkLicense } = require('../lib/license');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const status = await checkLicense(true);
  return res.status(status.valid ? 200 : 403).json(status);
};
