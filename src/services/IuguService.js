const fetch = require('node-fetch');
const { IUGU_API_TOKEN } = require('../config/env');

function getAuthHeader() {
  if (!IUGU_API_TOKEN) {
    console.error('CRITICAL: IUGU_API_TOKEN is missing in environment variables.');
    throw new Error('Missing IUGU_API_TOKEN');
  }
  const base64 = Buffer.from(`${IUGU_API_TOKEN}:`).toString('base64');
  return `Basic ${base64}`;
}

function mapIuguError(err, fallbackMessage) {
  if (!err) return fallbackMessage || 'Erro desconhecido no Iugu';
  if (typeof err === 'string') return err;
  if (err.errors && typeof err.errors === 'object') {
    const parts = [];
    for (const k of Object.keys(err.errors)) {
      const v = err.errors[k];
      const msg = Array.isArray(v) ? v.join(', ') : String(v);
      parts.push(`${k}: ${msg}`);
    }
    if (parts.length) return parts.join(' | ');
  }
  if (err.code && /^LR-\d+/.test(err.code)) return `Iugu: código ${err.code}`;
  if (err.message) return err.message;
  return fallbackMessage || 'Falha na operação com Iugu';
}

class IuguService {
  constructor() {
    this.baseUrl = 'https://api.iugu.com/v1';
    this.isTest = process.env.NODE_ENV !== 'production';
    if (!IuguService.loggedTokenCheck) {
      console.log(`IuguService initialized. Test Mode: ${this.isTest}. Token Present: ${!!IUGU_API_TOKEN}`);
      IuguService.loggedTokenCheck = true;
    }
  }

  async createCustomer(email, name, cpf) {
    const body = { email, name, cpf_cnpj: cpf }; 
    const res = await fetch(`${this.baseUrl}/customers`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = mapIuguError(json, `Falha ao criar cliente (${res.status})`);
      const error = new Error(message);
      error.status = res.status;
      error.details = json;
      throw error;
    }
    return json;
  }

  async createSubscription(customerId, planId) {
    const body = { customer_id: customerId, plan_identifier: planId };
    const res = await fetch(`${this.baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = mapIuguError(json, `Falha ao criar assinatura (${res.status})`);
      const error = new Error(message);
      error.status = res.status;
      error.details = json;
      throw error;
    }
    return json;
  }

  async getSubscriptionDetails(subscriptionId) {
    const res = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = mapIuguError(json, `Falha ao obter assinatura (${res.status})`);
      const error = new Error(message);
      error.status = res.status;
      error.details = json;
      throw error;
    }
    return json;
  }

  async createPaymentToken(data) {
    const body = {
      account_id: data.account_id,
      method: 'credit_card',
      test: data.test !== undefined ? data.test : this.isTest,
      data: {
        number: data.number,
        verification_value: data.cvv,
        first_name: data.first_name,
        last_name: data.last_name,
        month: data.month,
        year: data.year,
      },
    };
    const res = await fetch(`${this.baseUrl}/payment_token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Throw error but ensure it's caught gracefully upstream
      const error = new Error(mapIuguError(json, 'Falha ao tokenizar cartão'));
      error.details = json;
      throw error;
    }
    return json;
  }

  async charge(data) {
    console.log('IuguService: Processing charge...');
    const res = await fetch(`${this.baseUrl}/charge`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    
    // Allow caller to handle non-200 responses if they contain 'errors'
    // But return valid object structure to avoid crashes
    if (!res.ok) {
      console.error('IuguService: Charge failed', res.status, json);
      // Return the error response instead of throwing, to let controller handle it safely
      return { errors: json.errors || 'Falha ao processar cobrança', success: false, ...json };
    }
    return { success: true, ...json };
  }
}

module.exports = IuguService;
