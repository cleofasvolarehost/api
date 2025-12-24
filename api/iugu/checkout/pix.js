// Helper para CORS
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
    const { email, amount_cents, items } = req.body || {};
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
        email,
        payable_with: 'pix',
        items: items || [{ description: 'Assinatura', quantity: 1, price_cents: amount_cents }]
      })
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Iugu Error:', json);
      return res.status(400).json({ success: false, message: 'Payment Failed', details: json });
    }

    // Extract Pix data safely
    const pixData = json.pix || {};
    
    return res.status(200).json({
      success: true,
      data: {
        pix_qrcode: pixData.qrcode_text,
        pix: { qr_code_base64: pixData.qrcode }, 
        ticket_url: json.secure_url
      }
    });

  } catch (error) {
    console.error('Function Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
