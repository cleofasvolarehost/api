const serverless = require('serverless-http');
const app = require('../src/app');

module.exports = async (req, res) => {
  const handler = serverless(app);
  return handler(req, res);
};
