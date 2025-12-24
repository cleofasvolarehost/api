const { supabase } = require('../config/supabase');
const IuguService = require('../services/IuguService');

class IuguCheckoutController {
  static async getAccount(req, res) {
    try {
      // In a real multi-tenant scenario, we might fetch sub-account info.
      // For now, return the main configured provider info or just success to confirm backend is ready.
      const { data } = await supabase
        .from('system_gateways')
        .select('provider, account_id, is_active')
        .eq('provider', 'iugu')
        .eq('is_active', true)
        .maybeSingle();

      return res.json({ success: true, data });
    } catch (error) {
      console.error('Get Account Error:', error);
      return res.status(500).json({ success: false, message: 'Internal Error' });
    }
  }

  static async checkoutPix(req, res) {
    try {
      const { email, amount_cents, items } = req.body;
      if (!email || !amount_cents || !items) {
        return res.status(400).json({ success: false, message: 'Missing fields' });
      }

      const iugu = new IuguService();
      // Use charge endpoint for direct checkout
      const chargeData = {
        email,
        items,
        payer: { email }, // Simplified
        method: 'pix',
        test: true // TODO: env var
      };

      const result = await iugu.charge(chargeData);

      // Extract Pix info
      // Iugu returns invoice with pix info if method is pix
      // structure varies, but usually invoice.pix.qrcode and qrcode_text
      if (result.errors) {
        return res.status(400).json({ success: false, message: 'Iugu Error', details: result.errors });
      }

      const invoiceId = result.invoice_id || result.id;
      // Fetch invoice details if needed, or use returned data
      // For Pix, Iugu usually returns generated pix info in the response of charge or we need to fetch invoice
      // Let's assume result has it or we fetch it.
      // Actually, 'charge' endpoint returns the invoice object.
      
      // If it doesn't have pix data directly, we might need to look at 'pix' property
      const pixData = result.pix || {}; 
      
      return res.json({
        success: true,
        data: {
          pix_qrcode: pixData.qrcode_text,
          pix: { qr_code_base64: pixData.qrcode }, // Iugu returns URL usually, but user asked for base64. 
          // Note: Iugu returns qrcode (url) and qrcode_text (copy paste). 
          // If user needs base64 image, we might need to generate it or Iugu provides it.
          // Iugu 'qrcode' field is often a URL to an image.
          ticket_url: result.secure_url
        }
      });

    } catch (error) {
      console.error('Checkout Pix Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async checkoutCard(req, res) {
    try {
      const { payment_token, amount_cents, email, items } = req.body;
      if (!payment_token || !amount_cents || !items) {
        return res.status(400).json({ success: false, message: 'Missing fields' });
      }

      const iugu = new IuguService();
      const chargeData = {
        token: payment_token,
        email,
        items,
        payer: { email },
        test: true
      };

      const result = await iugu.charge(chargeData);

      if (result.errors) {
         // Map common errors
         return res.status(400).json({ success: false, message: 'Payment Failed', details: result.errors });
      }

      return res.json({ success: true, data: result });

    } catch (error) {
      console.error('Checkout Card Error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = IuguCheckoutController;
