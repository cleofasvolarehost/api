const setCors = require('../_lib/cors');
module.exports = async (req, res) => {
  if (setCors(req, res)) return;
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ message: 'endpoint de criação de assinatura', method: 'POST', status: 'ok' });
    return;
  }
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  var auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  res.status(200).json({ success: true, redirect: '/checkout/sucesso' });
};
