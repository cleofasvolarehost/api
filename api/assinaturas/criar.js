const setCors = require('../../_lib/cors');
module.exports = async (req, res) => {
  if (setCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).send('');
    return;
  }
  var auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  res.status(200).json({ success: true, redirect: '/checkout/sucesso' });
};
