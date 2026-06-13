const crypto = require('crypto');

let cache = {
  checkedAt: 0,
  valid: false,
  payload: null,
  error: null
};

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

function verifySignature(payload, signature, publicKeyPem) {
  if (!publicKeyPem || !signature) return false;
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(JSON.stringify(payload));
  verifier.end();
  return verifier.verify(publicKeyPem.replace(/\\n/g, '\n'), signature, 'base64');
}

async function checkLicense(force = false) {
  const required = bool(process.env.LICENSE_REQUIRED, false);
  if (!required) {
    return { valid: true, bypassed: true, reason: 'not_required' };
  }

  const cacheMinutes = Number(process.env.LICENSE_CACHE_MINUTES || 30);
  const now = Date.now();
  if (!force && cache.checkedAt && now - cache.checkedAt < cacheMinutes * 60_000) {
    return { valid: cache.valid, cached: true, payload: cache.payload, error: cache.error };
  }

  const serverUrl = String(process.env.LICENSE_SERVER_URL || '').replace(/\/$/, '');
  const key = String(process.env.LICENSE_KEY || '');
  const product = String(process.env.LICENSE_PRODUCT || 'DYNASTORE-WEB');
  const instanceId = String(process.env.LICENSE_INSTANCE_ID || process.env.VERCEL_URL || 'unknown-instance');

  if (!serverUrl || !key) {
    cache = { checkedAt: now, valid: false, payload: null, error: 'missing_configuration' };
    return { valid: false, error: 'missing_configuration' };
  }

  try {
    const response = await fetch(`${serverUrl}/api/licenses/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key, product, instanceId })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

    const signatureValid = process.env.LICENSE_PUBLIC_KEY
      ? verifySignature(data.payload, data.signature, process.env.LICENSE_PUBLIC_KEY)
      : true;

    const valid = Boolean(data.valid && signatureValid);
    cache = { checkedAt: now, valid, payload: data.payload || null, error: valid ? null : 'invalid_license' };
    return { valid, payload: data.payload || null, signatureValid };
  } catch (error) {
    cache = { checkedAt: now, valid: false, payload: null, error: error.message };
    return { valid: false, error: error.message };
  }
}

function requireLicense(handler) {
  return async function licensedHandler(req, res) {
    const status = await checkLicense(false);
    if (!status.valid) {
      return res.status(403).json({
        error: 'License validation failed',
        reason: status.error || 'invalid_license'
      });
    }
    return handler(req, res);
  };
}

module.exports = { checkLicense, requireLicense };
