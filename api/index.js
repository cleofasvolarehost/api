const serverless = require('serverless-http');
const app = require('../src/app');
const setCors = require('./_lib/cors');

module.exports = (req, res) => {
  // Apply CORS manually for Vercel Serverless environment
  // This ensures preflight OPTIONS requests are handled before Express
  if (setCors(req, res)) return;
  
  const handler = serverless(app);
  return handler(req, res);
};
