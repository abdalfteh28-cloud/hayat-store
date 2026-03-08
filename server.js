const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const SUPPORT_FILE = path.join(__dirname, 'data', 'support.json');

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
    baseUrl: (c.baseUrl || process.env.BASE_URL || '').trim() || `http://localhost:${PORT}`,
    adminUsername: (c.adminUsername || 'HASSAN.1949').trim(),
    adminPasswordHash: c.adminPasswordHash || '',
    coupons: Array.isArray(c.coupons) ? c.coupons : []
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
  if (obj.baseUrl !== undefined) existing.baseUrl = obj.baseUrl;
  if (obj.coupons !== undefined) existing.coupons = obj.coupons;
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
    googleAnalyticsId: '',
    coupons: []
  }, null, 2), 'utf8');
}
if (!fs.existsSync(PRODUCTS_FILE)) {
  const defaultProducts = [
    { id: 1, period: 'شهري', title: 'شهري', desc: 'لا محدود بدون استخدام عادل', longDescription: '', price: 269, quantity: 999, image: 'plan-monthly.png', planClass: 'plan-monthly', discountPercent: 0, couponCode: '' },
    { id: 2, period: '3 شهور', title: '٣ شهور', desc: 'لا محدود بدون استخدام عادل', longDescription: '', price: 719, quantity: 999, image: 'plan-3months.png', planClass: 'plan-3months', discountPercent: 0, couponCode: '' },
    { id: 3, period: '6 شهور', title: '٦ شهور', desc: 'لا محدود بدون استخدام عادل', longDescription: '', price: 1349, quantity: 999, image: 'plan-6months.png', planClass: 'plan-6months', discountPercent: 0, couponCode: '' },
    { id: 4, period: 'سنة', title: 'سنة', desc: 'لا محدود بدون استخدام عادل', longDescription: '', price: 2200, quantity: 999, image: 'plan-year.png', planClass: 'plan-year', discountPercent: 0, couponCode: '' }
  ];
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(defaultProducts, null, 2), 'utf8');
}
if (!fs.existsSync(SUPPORT_FILE)) {
  fs.writeFileSync(SUPPORT_FILE, JSON.stringify([], null, 2), 'utf8');
}

function readProducts() {
  try {
    return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
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

function readSupport() {
  try {
    return JSON.parse(fs.readFileSync(SUPPORT_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveSupport(list) {
  fs.writeFileSync(SUPPORT_FILE, JSON.stringify(list, null, 2), 'utf8');
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

// ─── فحص صحة الباك إند (لتأكيد الربط) ───
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'الباك إند يعمل',
    timestamp: new Date().toISOString()
  });
});

// ─── المنتجات (عام) ───
app.get('/api/products', (req, res) => {
  try {
    res.json({ success: true, products: readProducts() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// ─── التحقق من كوبون الخصم ───
app.get('/api/coupon/:code', (req, res) => {
  const c = getConfig();
  const code = (req.params.code || '').trim().toUpperCase();
  const coupon = (c.coupons || []).find(x => String(x.code || '').toUpperCase() === code);
  if (!coupon) return res.json({ valid: false });
  res.json({ valid: true, type: coupon.type || 'percent', value: coupon.value || 0 });
});

// ─── إعدادات المتجر (للفرونت إند) ───
app.get('/api/config', (req, res) => {
  const c = getConfig();
  res.json({
    paymentGateway: c.moyasarSecretKey ? 'moyasar' : 'none',
    shippingEnabled: true,
    googleAnalyticsId: c.googleAnalyticsId || '',
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
    baseUrl: c.baseUrl || '',
    coupons: c.coupons || []
  });
});

// ─── حفظ إعدادات المتجر (بوابة الدفع، الشحن، جوجل، تغيير كلمة المرور) ───
app.post('/api/admin/config', (req, res) => {
  try {
    const { username, password, newPassword, moyasarSecretKey, shippingStandardPrice, shippingExpressPrice, googleAnalyticsId, baseUrl, coupons } = req.body || {};
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
        baseUrl: baseUrl !== undefined ? String(baseUrl).trim() : undefined,
        coupons: coupons !== undefined ? (Array.isArray(coupons) ? coupons : []) : undefined
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
    const { name, phone, email, address, notes, items, total, shippingOptionId, shippingCost, discountAmount } = req.body;
    if (!name || !phone || !address || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'بيانات ناقصة: الاسم، الجوال، والعنوان مطلوبة'
      });
    }

    const subtotal = typeof total === 'number' ? total : items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
    const shipping = typeof shippingCost === 'number' ? shippingCost : 0;
    const discount = typeof discountAmount === 'number' ? Math.min(discountAmount, subtotal) : 0;
    const totalWithShipping = Math.max(0, subtotal - discount + shipping);

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
      discountAmount: discount,
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

// ─── الطلبات (للداشبورد — يتطلب تسجيل أدمن) ───
function parseBasicAuth(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return null;
  try {
    const b = Buffer.from(h.slice(6), 'base64').toString('utf8');
    const i = b.indexOf(':');
    if (i === -1) return null;
    return { username: b.slice(0, i), password: b.slice(i + 1) };
  } catch (e) { return null; }
}

app.get('/api/admin/orders', (req, res) => {
  try {
    const auth = parseBasicAuth(req);
    if (!auth || !verifyAdmin(auth.username, auth.password)) {
      return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
    }
    const orders = readOrders();
    res.json({ success: true, orders: orders.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

app.get('/api/admin/products', (req, res) => {
  try {
    const auth = parseBasicAuth(req);
    if (!auth || !verifyAdmin(auth.username, auth.password)) {
      return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
    }
    res.json({ success: true, products: readProducts() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

app.post('/api/admin/products', (req, res) => {
  try {
    const auth = parseBasicAuth(req);
    if (!auth || !verifyAdmin(auth.username, auth.password)) {
      return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
    }
    const products = req.body.products;
    if (!Array.isArray(products)) return res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
    saveProducts(products);
    res.json({ success: true, message: 'تم حفظ المنتجات' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

app.get('/api/admin/support', (req, res) => {
  try {
    const auth = parseBasicAuth(req);
    if (!auth || !verifyAdmin(auth.username, auth.password)) {
      return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
    }
    res.json({ success: true, requests: readSupport().reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

app.post('/api/support', (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body || {};
    if (!name || !message) {
      return res.status(400).json({ success: false, message: 'الاسم والرسالة مطلوبان' });
    }
    const list = readSupport();
    list.push({
      id: Date.now(),
      date: new Date().toISOString(),
      name: String(name).trim(),
      phone: String(phone || '').trim(),
      email: String(email || '').trim(),
      subject: String(subject || '').trim(),
      message: String(message).trim()
    });
    saveSupport(list);
    res.json({ success: true, message: 'تم استلام رسالتك وسنتواصل معك قريباً' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  const c = getConfig();
  console.log('متجر حياة يعمل على ' + c.baseUrl);
  if (c.moyasarSecretKey) console.log('بوابة الدفع: Moyasar مفعّلة');
});
