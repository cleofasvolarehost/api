const setCors = require('./_lib/cors');
module.exports = (req, res) => {
  if (setCors(req, res)) return;
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(JSON.stringify({ status: 'ok', service: 'barbearia-backend', uptime, timestamp }));
};
