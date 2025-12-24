module.exports = function setCors(req, res) {
  var origin = req.headers.origin;
  var allowed = ['https://www.crdev.app', 'https://crdev.app'];
  var use = allowed.indexOf(origin) >= 0 ? origin : allowed[0];
  
  res.setHeader('Access-Control-Allow-Origin', use);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return true;
  }
  return false;
}
