const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');

function getConfig() {
  let c = {};
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      c = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) {}
  return {
    moyasarSecretKey: c.moyasarSecretKey || process.env.MOYASAR_SECRET_KEY || '',
    shippingStandardPrice: c.shippingStandardPrice != null ? c.shippingStandardPrice : 36,
    shippingExpressPrice: c.shippingExpressPrice != null ? c.shippingExpressPrice : 41,
    googleAnalyticsId: c.googleAnalyticsId || process.env.GOOGLE_ANALYTICS_ID || '',
    googleSiteVerification: c.googleSiteVerification || '',
    baseUrl: (c.baseUrl || process.env.BASE_URL || '').trim() || `http://localhost:${PORT}`,
    adminUsername: (c.adminUsername || 'HASSAN.1949').trim(),
    adminPasswordHash: c.adminPasswordHash || ''
  };
}
function saveConfig(obj) {
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  let existing = {};
  try {
    if (fs.existsSync(CONFIG_FILE)) existing = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (e) {}
  if (obj.adminPasswordHash) existing.adminPasswordHash = obj.adminPasswordHash;
  if (obj.adminUsername !== undefined) existing.adminUsername = obj.adminUsername;
  if (obj.moyasarSecretKey !== undefined) existing.moyasarSecretKey = obj.moyasarSecretKey;
  if (obj.shippingStandardPrice !== undefined) existing.shippingStandardPrice = obj.shippingStandardPrice;
  if (obj.shippingExpressPrice !== undefined) existing.shippingExpressPrice = obj.shippingExpressPrice;
  if (obj.googleAnalyticsId !== undefined) existing.googleAnalyticsId = obj.googleAnalyticsId;
  if (obj.googleSiteVerification !== undefined) existing.googleSiteVerification = obj.googleSiteVerification;
  if (obj.baseUrl !== undefined) existing.baseUrl = obj.baseUrl;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(existing, null, 2), 'utf8');
}
function hashPassword(pwd) {
  return crypto.createHash('sha256').update(String(pwd)).digest('hex');
}
function verifyAdmin(username, password) {
  const cfg = getConfig();
  if (!cfg.adminPasswordHash) return true;
  const userOk = (cfg.adminUsername || 'HASSAN.1949').trim() === String(username || '').trim();
  const passOk = cfg.adminPasswordHash === hashPassword(password);
  return userOk && passOk;
}

// وسطاء
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// التأكد من وجود مجلد وملف الطلبات والإعدادات الافتراضية
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf8');
}
if (!fs.existsSync(CONFIG_FILE)) {
  const defaultHash = crypto.createHash('sha256').update('Aa@191610').digest('hex');
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({
    adminUsername: 'HASSAN.1949',
    adminPasswordHash: defaultHash,
    shippingStandardPrice: 36,
    shippingExpressPrice: 41,
    baseUrl: '',
    moyasarSecretKey: '',
    googleAnalyticsId: ''
  }, null, 2), 'utf8');
}

function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
}

function findOrderById(id) {
  const orders = readOrders();
  return orders.find(o => o.id === parseInt(id, 10));
}

function updateOrderStatus(orderId, status, paymentId) {
  const orders = readOrders();
  const i = orders.findIndex(o => o.id === parseInt(orderId, 10));
  if (i === -1) return false;
  orders[i].status = status;
  if (paymentId) orders[i].paymentId = paymentId;
  saveOrders(orders);
  return true;
}

// ─── sitemap و robots لـ Google ───
app.get('/sitemap.xml', (req, res) => {
  const base = (getConfig().baseUrl || '').replace(/\/$/, '') || `http://localhost:${PORT}`;
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>`);
});
app.get('/robots.txt', (req, res) => {
  const base = (getConfig().baseUrl || '').replace(/\/$/, '') || `http://localhost:${PORT}`;
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml`);
});

// ─── فحص صحة الباك إند (لتأكيد الربط) ───
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'الباك إند يعمل',
    timestamp: new Date().toISOString()
  });
});

// ─── إعدادات المتجر (للفرونت إند) ───
app.get('/api/config', (req, res) => {
  const c = getConfig();
  res.json({
    paymentGateway: c.moyasarSecretKey ? 'moyasar' : 'none',
    shippingEnabled: true,
    googleAnalyticsId: c.googleAnalyticsId || '',
    googleSiteVerification: c.googleSiteVerification || '',
    baseUrl: c.baseUrl
  });
});

// ─── حالة الإعدادات (لصفحة الإعدادات) ───
app.get('/api/admin/status', (req, res) => {
  const c = getConfig();
  res.json({
    hasConfig: !!c.adminPasswordHash,
    adminUsername: c.adminUsername || 'HASSAN.1949',
    paymentConfigured: !!c.moyasarSecretKey,
    shippingStandardPrice: c.shippingStandardPrice,
    shippingExpressPrice: c.shippingExpressPrice,
    googleAnalyticsId: c.googleAnalyticsId || '',
    googleSiteVerification: c.googleSiteVerification || '',
    baseUrl: c.baseUrl || ''
  });
});

// ─── حفظ إعدادات المتجر (بوابة الدفع، الشحن، جوجل، تحقق جوجل، تغيير كلمة المرور) (بوابة الدفع، الشحن، جوجل، تغيير كلمة المرور) ───
app.post('/api/admin/config', (req, res) => {
  try {
    const { username, password, newPassword, moyasarSecretKey, shippingStandardPrice, shippingExpressPrice, googleAnalyticsId, googleSiteVerification, baseUrl } = req.body || {};
    const c = getConfig();

    if (c.adminPasswordHash) {
      if (!username || !password || !verifyAdmin(username, password)) {
        return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
      }
      const toSave = {
        moyasarSecretKey: moyasarSecretKey !== undefined ? String(moyasarSecretKey).trim() : undefined,
        shippingStandardPrice: shippingStandardPrice !== undefined ? parseInt(shippingStandardPrice, 10) : undefined,
        shippingExpressPrice: shippingExpressPrice !== undefined ? parseInt(shippingExpressPrice, 10) : undefined,
        googleAnalyticsId: googleAnalyticsId !== undefined ? String(googleAnalyticsId).trim() : undefined,
        googleSiteVerification: googleSiteVerification !== undefined ? String(googleSiteVerification).trim() : undefined,
        baseUrl: baseUrl !== undefined ? String(baseUrl).trim() : undefined
      };
      if (newPassword && String(newPassword).length >= 4) {
        toSave.adminPasswordHash = hashPassword(newPassword);
      }
      saveConfig(toSave);
      return res.json({ success: true, message: 'تم حفظ الإعدادات' });
    }

    if (!newPassword || String(newPassword).length < 4) {
      return res.status(400).json({ success: false, message: 'اختر كلمة مرور للإعدادات (4 أحرف على الأقل)' });
    }
    saveConfig({
      adminUsername: 'HASSAN.1949',
      adminPasswordHash: hashPassword(newPassword),
      moyasarSecretKey: moyasarSecretKey !== undefined ? String(moyasarSecretKey).trim() : '',
      shippingStandardPrice: shippingStandardPrice !== undefined ? parseInt(shippingStandardPrice, 10) : 36,
      shippingExpressPrice: shippingExpressPrice !== undefined ? parseInt(shippingExpressPrice, 10) : 41,
      googleAnalyticsId: googleAnalyticsId !== undefined ? String(googleAnalyticsId).trim() : '',
      googleSiteVerification: googleSiteVerification !== undefined ? String(googleSiteVerification).trim() : '',
      baseUrl: baseUrl !== undefined ? String(baseUrl).trim() : ''
    });
    return res.json({ success: true, message: 'تم حفظ الإعدادات' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// ─── خيارات الشحن (بوابة الشحن) ───
app.get('/api/shipping/options', (req, res) => {
  try {
    const c = getConfig();
    const options = [
      { id: 'standard', label: 'توصيل عادي', labelEn: 'Standard', price: c.shippingStandardPrice, days: '2-4 أيام' },
      { id: 'express', label: 'توصيل سريع', labelEn: 'Express', price: c.shippingExpressPrice, days: '1-2 يوم' }
    ];
    res.json({ success: true, options });
  } catch (err) {
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// ─── إنشاء الطلب ───
app.post('/api/order', (req, res) => {
  try {
    const { name, phone, email, address, notes, items, total, shippingOptionId, shippingCost } = req.body;
    if (!name || !phone || !address || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'بيانات ناقصة: الاسم، الجوال، والعنوان مطلوبة'
      });
    }

    const subtotal = typeof total === 'number' ? total : items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
    const shipping = typeof shippingCost === 'number' ? shippingCost : 0;
    const totalWithShipping = subtotal + shipping;

    const order = {
      id: Date.now(),
      date: new Date().toISOString(),
      name,
      phone,
      email: email || '',
      address,
      notes: notes || '',
      items,
      subtotal,
      shippingOptionId: shippingOptionId || '',
      shippingCost: shipping,
      total: totalWithShipping,
      status: getConfig().moyasarSecretKey ? 'pending_payment' : 'confirmed'
    };

    const orders = readOrders();
    orders.push(order);
    saveOrders(orders);

    res.json({
      success: true,
      message: 'تم استلام طلبك',
      orderId: order.id,
      total: order.total,
      paymentRequired: !!getConfig().moyasarSecretKey
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

// ─── بوابة الدفع: إنشاء فاتورة Moyasar ───
app.post('/api/create-payment', async (req, res) => {
  const cfg = getConfig();
  const secret = cfg.moyasarSecretKey;
  const baseUrl = cfg.baseUrl;
  if (!secret) {
    return res.status(503).json({ success: false, message: 'بوابة الدفع غير مفعّلة. أدخل مفتاح Moyasar من إعدادات المتجر.' });
  }

  try {
    const { orderId, amount, description } = req.body;
    if (!orderId || !amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'بيانات الدفع ناقصة' });
    }

    const order = findOrderById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

    const amountHalalas = Math.round(parseFloat(amount) * 100);
    if (amountHalalas < 100) {
      return res.status(400).json({ success: false, message: 'المبلغ غير صالح' });
    }

    const successUrl = `${baseUrl}/?payment=success&orderId=${orderId}`;
    const callbackUrl = `${baseUrl}/api/payment/callback`;

    const response = await fetch('https://api.moyasar.com/v1/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(secret + ':').toString('base64')
      },
      body: JSON.stringify({
        amount: amountHalalas,
        currency: 'SAR',
        description: description || `طلب #${orderId} - حياة`,
        success_url: successUrl,
        callback_url: callbackUrl,
        metadata: { orderId: String(orderId) }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Moyasar error:', data);
      return res.status(400).json({
        success: false,
        message: data.message || 'فشل إنشاء رابط الدفع'
      });
    }

    if (data.url) {
      updateOrderStatus(orderId, 'pending_payment', data.id);
      return res.json({ success: true, paymentUrl: data.url, invoiceId: data.id });
    }

    res.status(400).json({ success: false, message: 'لم يتم إرجاع رابط الدفع' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'حدث خطأ في بوابة الدفع' });
  }
});

// ─── استدعاء Moyasar بعد الدفع (Webhook) ───
app.post('/api/payment/callback', (req, res) => {
  try {
    const body = req.body || {};
    const invoiceId = body.id;
    const status = body.status;
    const metadata = body.metadata || {};
    const orderId = metadata.orderId;

    if (status === 'paid' && orderId) {
      updateOrderStatus(orderId, 'paid', invoiceId);
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

// ─── صفحة النجاح بعد الدفع (العميل يرجع هنا) ───
app.get('/api/orders', (req, res) => {
  try {
    res.json({ success: true, orders: readOrders() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  const c = getConfig();
  console.log('متجر حياة يعمل على ' + c.baseUrl);
  if (c.moyasarSecretKey) console.log('بوابة الدفع: Moyasar مفعّلة');
});
