module.exports = function setCors(req, res) {
  const origin = req.headers.origin;
  const envOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const allowed = ['https://www.crdev.app', 'https://crdev.app', ...envOrigins];
  const uniqueOrigins = [...new Set(allowed)];
  const use = uniqueOrigins.includes(origin) ? origin : uniqueOrigins[0];

  res.setHeader('Access-Control-Allow-Origin', use);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
};
