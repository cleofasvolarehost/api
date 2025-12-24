module.exports = function setCors(req, res) {
  var origin = req.headers.origin;
  var allowed = ['https://www.crdev.app'];
  var use = allowed.indexOf(origin) >= 0 ? origin : allowed[0];
  res.setHeader('Access-Control-Allow-Origin', use);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,HEAD,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return true;
  }
  return false;
}
