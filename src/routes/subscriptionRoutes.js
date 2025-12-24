const express = require('express');
const SubscriptionController = require('../controllers/SubscriptionController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/checkout', auth, SubscriptionController.checkout);
router.post('/renew', auth, SubscriptionController.renew);
router.post('/cancel', auth, SubscriptionController.cancel);

module.exports = router;
