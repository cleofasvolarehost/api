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
    const { email, amount_cents, amount, items, description } = req.body || {};

    const toCents = (v) => Math.round(Number(v) * 100);
    const isPosInt = (v) => Number.isFinite(v) && v > 0 && Math.floor(v) === v;

    let finalAmountCents = undefined;
    if (isPosInt(Number(amount_cents))) {
      finalAmountCents = Number(amount_cents);
    } else if (amount != null && Number(amount) > 0) {
      finalAmountCents = toCents(amount);
    } else if (Array.isArray(items) && items.length && isPosInt(Number(items[0].price_cents))) {
      finalAmountCents = Number(items[0].price_cents);
    }

    let finalItems = Array.isArray(items) && items.length
      ? items.map(it => ({
          description: it.description || 'Assinatura',
          quantity: it.quantity || 1,
          price_cents: Number(it.price_cents || 0)
        }))
      : [{ description: description || 'Assinatura', quantity: 1, price_cents: finalAmountCents }];

    if (!email) {
      return res.status(400).json({ success: false, message: 'Missing email' });
    }
    if (!finalAmountCents || !Number.isFinite(finalAmountCents) || finalAmountCents <= 0) {
      return res.status(400).json({ success: false, message: 'Missing amount_cents or amount' });
    }
    if (!Array.isArray(finalItems) || finalItems.length === 0 || finalItems.some(it => !it.price_cents || it.price_cents <= 0)) {
      return res.status(400).json({ success: false, message: 'Invalid items' });
    }

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
        items: finalItems,
        payer: { email }
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
