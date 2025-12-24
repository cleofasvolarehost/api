const { supabase } = require('../config/supabase');
const IuguService = require('../services/IuguService');
const { NODE_ENV } = require('../config/env');

const isTest = NODE_ENV !== 'production';

class IuguCheckoutController {
  static async getAccount(req, res) {
    try {
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
      const chargeData = {
        email,
        items,
        payer: { email },
        method: 'pix',
        test: isTest
      };

      const result = await iugu.charge(chargeData);

      if (result.errors) {
        return res.status(400).json({ success: false, message: 'Iugu Error', details: result.errors });
      }

      const pixData = result.pix || {}; 
      
      return res.json({
        success: true,
        data: {
          pix_qrcode: pixData.qrcode_text,
          pix: { qr_code_base64: pixData.qrcode }, 
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
        test: isTest
      };

      const result = await iugu.charge(chargeData);

      if (result.errors) {
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
