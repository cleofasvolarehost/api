const express = require('express');
const IuguAdminController = require('../controllers/IuguAdminController');
const IuguCheckoutController = require('../controllers/IuguCheckoutController');
const router = express.Router();

// Admin / Webhook related
router.post('/triggers/register', IuguAdminController.registerTriggers);

// Checkout / Public (or Auth protected if needed, but usually public for checkout if token used)
// User prompt asked for these specific routes under /api/iugu
router.get('/account', IuguCheckoutController.getAccount);
router.post('/checkout/pix', IuguCheckoutController.checkoutPix);
router.post('/checkout/card', IuguCheckoutController.checkoutCard);

module.exports = router;
