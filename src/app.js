const express = require('express');
const cors = require('cors');
const { ALLOWED_ORIGINS } = require('./config/env');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const iuguRoutes = require('./routes/iuguRoutes');
const assinaturaRoutes = require('./routes/assinaturas');
const adminGatewayRoutes = require('./routes/adminGatewayRoutes');

const app = express();
app.set('trust proxy', 1);

const origins = (ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const corsOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  credentials: true
};

if (origins.length > 0) {
  corsOptions.origin = origins;
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/iugu', iuguRoutes);
app.use('/api/assinaturas', assinaturaRoutes);
app.use('/api/admin/gateways', adminGatewayRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'barbearia-backend', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.send('API online');
});

module.exports = app;
