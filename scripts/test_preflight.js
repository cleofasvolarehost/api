const handler = require('../api/iugu/checkout/pix');

function createMockRes() {
  const headers = {};
  return {
    headers,
    statusCode: 0,
    setHeader(key, value) {
      headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      console.log('JSON', this.statusCode || 200, JSON.stringify(payload));
      return this;
    },
    end(text = '') {
      console.log('END', this.statusCode || 200, text);
      return this;
    }
  };
}

async function testOptions() {
  const req = { method: 'OPTIONS', headers: { origin: 'https://www.crdev.app' } };
  const res = createMockRes();
  await handler(req, res);
  console.log('Headers', res.headers);
}

async function testPostMissingToken() {
  const req = {
    method: 'POST',
    headers: { origin: 'https://www.crdev.app', 'content-type': 'application/json' },
    body: { email: 'test@example.com', amount_cents: 1000, items: [{ description: 'Test', quantity: 1, price_cents: 1000 }] }
  };
  const res = createMockRes();
  const prev = process.env.IUGU_API_TOKEN;
  delete process.env.IUGU_API_TOKEN;
  await handler(req, res);
  process.env.IUGU_API_TOKEN = prev;
}

async function testPostMissingAmount() {
  const req = {
    method: 'POST',
    headers: { origin: 'https://www.crdev.app', 'content-type': 'application/json' },
    body: { email: 'test@example.com' }
  };
  const res = createMockRes();
  await handler(req, res);
}

(async () => {
  await testOptions();
  await testPostMissingToken();
  await testPostMissingAmount();
})();
