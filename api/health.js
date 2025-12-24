module.exports = (req, res) => {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(JSON.stringify({ status: 'ok', uptime, timestamp }));
};
