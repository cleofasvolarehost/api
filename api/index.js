const serverless = require('serverless-http');
const app = require('../src/app');
const setCors = require('./_lib/cors');

const handler = serverless(app);

module.exports = (req, res) => {
  // Apply CORS manually for Vercel Serverless environment
  if (setCors(req, res)) return;
  
  return handler(req, res);
};
