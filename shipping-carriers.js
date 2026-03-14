/**
 * ربط شركات الشحن: أرامكس، إم إس إم إس، DHL، ريد بوكس
 * يجمع أسعار التوصيل من كل شركة مفعّلة ويدمجها مع الخيارات الثابتة.
 */

const CARRIER_DEFAULTS = {
  aramex: { enabled: false, username: '', password: '', accountNumber: '', accountPin: '', accountEntity: '', countryCode: 'SA' },
  smsa: { enabled: false, apiKey: '', accountNumber: '', passKey: '' },
  dhl: { enabled: false, apiKey: '', accountNumber: '' },
  redbox: { enabled: false, apiKey: '', merchantId: '' }
};

function mergeCarrierConfig(carriers) {
  const out = {};
  ['aramex', 'smsa', 'dhl', 'redbox'].forEach(key => {
    out[key] = { ...CARRIER_DEFAULTS[key], ...(carriers[key] || {}) };
  });
  return out;
}

/**
 * أرامكس — Rate Calculator API (XML)
 * الوثائق: https://www.aramex.com/us/en/developers-solution-center/aramex-apis
 * تحتاج: Account Number, Username, Password, Account PIN, Account Entity
 */
async function getAramexRates(cfg, params) {
  if (!cfg.enabled || !cfg.username || !cfg.password || !cfg.accountNumber) return [];
  const weight = (params && params.weight) || 0.5;
  const city = (params && params.city) || '';
  try {
    // TODO: استدعاء Aramex Rate Calculator API (XML/SOAP)
    // مثال: طلب إلى https://ws.aramex.net/... مع بيانات الحساب والوزن والمدينة
    // حالياً نرجع خياراً تجريبياً عند تفعيل الحساب
    return [
      { id: 'aramex_standard', carrier: 'aramex', label: 'أرامكس — توصيل عادي', labelEn: 'Aramex Standard', price: 35, days: '2–4 أيام' },
      { id: 'aramex_express', carrier: 'aramex', label: 'أرامكس — توصيل سريع', labelEn: 'Aramex Express', price: 45, days: '1–2 يوم' }
    ];
  } catch (e) {
    console.error('Aramex rates error:', e.message);
    return [];
  }
}

/**
 * إم إس إم إس — SMSA Express
 * التواصل: fsaid@smsaexpress.com أو info@smsaexpress.com — +966-9200-09999
 * تحتاج: حساب SMSA و API Key من الشركة
 */
async function getSMSARates(cfg, params) {
  if (!cfg.enabled || !cfg.apiKey) return [];
  try {
    // TODO: استدعاء SMSA API (REST) عند توفير الوثائق
    return [
      { id: 'smsa_standard', carrier: 'smsa', label: 'إم إس إم إس — توصيل', labelEn: 'SMSA Delivery', price: 30, days: '2–3 أيام' },
      { id: 'smsa_express', carrier: 'smsa', label: 'إم إس إم إس — سريع', labelEn: 'SMSA Express', price: 40, days: '1 يوم' }
    ];
  } catch (e) {
    console.error('SMSA rates error:', e.message);
    return [];
  }
}

/**
 * DHL Express — MyDHL API (REST)
 * الوثائق: https://developer.dhl.com/api-reference/dhl-express-mydhl-api
 * تحتاج: حساب DHL Express و API Key
 */
async function getDHLRates(cfg, params) {
  if (!cfg.enabled || !cfg.apiKey) return [];
  try {
    // TODO: استدعاء DHL Rating API
    return [
      { id: 'dhl_express', carrier: 'dhl', label: 'DHL — إكسبريس', labelEn: 'DHL Express', price: 55, days: '1–2 يوم' },
      { id: 'dhl_economy', carrier: 'dhl', label: 'DHL — اقتصادي', labelEn: 'DHL Economy', price: 38, days: '3–5 أيام' }
    ];
  } catch (e) {
    console.error('DHL rates error:', e.message);
    return [];
  }
}

/**
 * ريد بوكس — RedBox
 * التوثيق والتكامل: https://support.redbox.systems — تواصل مع ريد بوكس للحصول على API
 */
async function getRedBoxRates(cfg, params) {
  if (!cfg.enabled || !cfg.apiKey) return [];
  try {
    // TODO: استدعاء RedBox API عند توفير الوثائق
    return [
      { id: 'redbox_express', carrier: 'redbox', label: 'ريد بوكس — إكسبريس', labelEn: 'RedBox Express', price: 32, days: '24–72 ساعة' }
    ];
  } catch (e) {
    console.error('RedBox rates error:', e.message);
    return [];
  }
}

/**
 * يجمع خيارات الشحن الثابتة (من الإعدادات) مع خيارات شركات الشحن المفعّلة.
 * @param {object} config - إعدادات المتجر (من getConfig())
 * @param {object} params - اختياري: { weight, city, country } لاستخدامها في استدعاءات API
 * @returns {Promise<Array>} مصفوفة خيارات { id, label, labelEn, price, days, carrier? }
 */
async function getRatesFromCarriers(config, params = {}) {
  const carriers = mergeCarrierConfig(config.shippingCarriers || {});
  const staticOptions = [
    { id: 'standard', carrier: 'internal', label: 'توصيل عادي', labelEn: 'Standard', price: config.shippingStandardPrice ?? 36, days: '2-4 أيام' },
    { id: 'express', carrier: 'internal', label: 'توصيل سريع', labelEn: 'Express', price: config.shippingExpressPrice ?? 41, days: '1-2 يوم' }
  ];

  const fromCarriers = [];
  const aramexRates = await getAramexRates(carriers.aramex, params);
  const smsaRates = await getSMSARates(carriers.smsa, params);
  const dhlRates = await getDHLRates(carriers.dhl, params);
  const redboxRates = await getRedBoxRates(carriers.redbox, params);

  fromCarriers.push(...aramexRates, ...smsaRates, ...dhlRates, ...redboxRates);

  return [...staticOptions, ...fromCarriers];
}

module.exports = {
  getRatesFromCarriers,
  mergeCarrierConfig,
  CARRIER_DEFAULTS
};
