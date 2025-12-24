const serverless = require('serverless-http');
const app = require('../src/app');

// Move CORS logic inline to avoid dependency issues and ensure execution
function applyCors(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = ['https://www.crdev.app', 'https://crdev.app'];
  
  // If origin is allowed, echo it back. Otherwise use the first allowed origin as fallback.
  // Using '*' is not allowed with credentials.
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle preflight directly
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return true;
  }
  return false;
}

const handler = serverless(app);

module.exports = async (req, res) => {
  // 1. Handle CORS immediately at the edge function entry
  if (applyCors(req, res)) return;

  // 2. Pass to Express application
  try {
    return await handler(req, res);
  } catch (error) {
    console.error('Unhandled Function Error:', error);
    // Ensure JSON response even on crash, with CORS headers already set
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }));
    }
  }
};
