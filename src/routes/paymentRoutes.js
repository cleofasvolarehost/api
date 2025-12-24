const express = require('express');
const PaymentController = require('../controllers/PaymentController');
const router = express.Router();

router.post('/pix/create', PaymentController.createPix);

module.exports = router;
