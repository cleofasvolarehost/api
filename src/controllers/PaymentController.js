class PaymentController {
  static async createPix(req, res) {
    try {
      const { establishment_id, appointment_data } = req.body || {};
      if (!establishment_id || !appointment_data?.price) {
        return res.status(400).json({ error: 'Dados inválidos' });
      }
      const code = '00020126580014BR.GOV.BCB.PIX0136demo-estab-uuid-1234520400005303986540510.005802BR5913Barbearia Demo6009Sao Paulo62070503***6304E2CA';
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACt...';
      return res.json({ qr_code: code, qr_code_base64: pngBase64, payment_id: Date.now(), status: 'pending' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
}

module.exports = PaymentController;
