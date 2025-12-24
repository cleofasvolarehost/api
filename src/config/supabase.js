const { createClient } = require('@supabase/supabase-js');

function isPlaceholder(value) {
  return typeof value === 'string' && /^your_/i.test(value);
}

function isValidHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

const rawUrl = process.env.SUPABASE_URL;
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!isValidHttpUrl(rawUrl) || isPlaceholder(rawUrl)) {
  console.warn('Supabase URL is not configured correctly in environment variables.');
}

if (!rawKey || isPlaceholder(rawKey)) {
  console.warn('Supabase Service Role Key is not configured correctly in environment variables.');
}

const supabaseUrl = rawUrl;
const supabaseServiceKey = rawKey;

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder');

module.exports = { supabase };
