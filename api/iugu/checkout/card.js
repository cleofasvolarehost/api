const fetch = require('node-fetch');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.crdev.app');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { payment_token, email, items } = req.body || {};
    const token = process.env.IUGU_API_TOKEN;

    if (!token) {
      console.error('Missing IUGU_API_TOKEN');
      return res.status(500).json({ success: false, message: 'Server Configuration Error' });
    }

    const response = await fetch('https://api.iugu.com/v1/charge', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(token + ':').toString('base64')}`
      },
      body: JSON.stringify({
        token: payment_token,
        email,
        items,
        payer: { email }
      })
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Iugu Error:', json);
      return res.status(400).json({ success: false, message: 'Payment Failed', details: json });
    }

    return res.status(200).json({ success: true, data: json });

  } catch (error) {
    console.error('Function Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
