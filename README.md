# متجر حياة — شرائح الإنترنت

واجهة متجر (HTML/CSS/JS) مع باك إند Node.js: طلبات، بوابة دفع (Moyasar)، شحن، وGoogle Analytics.

## تشغيل الموقع وربط الباك إند

### 1. تثبيت الحزم
```bash
npm install
```

### 2. إعداد المتغيرات (مهم للدفع والشحن وجوجل)
انسخ ملف المثال وعدّله:
```bash
copy .env.example .env
```
ثم افتح `.env` وضَع:
- **BASE_URL** — عنوان الموقع عند النشر (مثل `https://your-site.onrender.com`)
- **MOYASAR_SECRET_KEY** — مفتاح Moyasar السري (من [moyasar.com](https://moyasar.com)) لتفعيل بوابة الدفع
- **SHIPPING_STANDARD_PRICE** و **SHIPPING_EXPRESS_PRICE** — أسعار الشحن بالريال
- **GOOGLE_ANALYTICS_ID** — معرف Google Analytics 4 (مثل `G-XXXXXXXXXX`)

### 3. تشغيل السيرفر
```bash
npm start
```

### 4. فتح المتجر
افتح المتصفح على: **http://localhost:3000**

الطلبات تُحفظ في `data/orders.json`. إن فعّلت Moyasar، الطلبات تبدأ بحالة `pending_payment` ثم `paid` بعد الدفع.

---

## بوابة الدفع (Moyasar)

1. سجّل في [moyasar.com](https://moyasar.com) وأنشئ تطبيقاً.
2. من لوحة التحكم خذ **Secret Key** (يبدأ بـ `sk_`).
3. ضعه في `.env` كقيمة لـ `MOYASAR_SECRET_KEY`.
4. عند إتمام الطلب ينتقل العميل لصفحة الدفع لدى Moyasar، وبعد الدفع يعود لموقعك مع رسالة نجاح.

ملاحظة: عند النشر على الإنترنت ضع في `.env` قيمة **BASE_URL** هي رابط موقعك الفعلي (مثل `https://hayat-store.onrender.com`) حتى تعمل روابط العودة من الدفع بشكل صحيح.

---

## بوابة الشحن

- الخدمة الحالية تعرض خيارين: **توصيل عادي** و **توصيل سريع** مع أسعار من `.env`.
- لتوصيل مع شركة شحن (أرامكس، إم إس إم إس، إلخ) يمكن لاحقاً ربط API الخاصة بهم في `server.js` داخل `/api/shipping/options` واستبدال الخيارات الثابتة بالأسعار الحقيقية.

---

## Google (Analytics)

- ضع في `.env` قيمة **GOOGLE_ANALYTICS_ID** (معرف تدفق GA4، مثل `G-XXXXXXXXXX`).
- الموقع يحمّل تلقائياً كود Google Analytics ويُسجّل الزيارات وصفحات الطلب عند وجود هذا المعرف.

---

## رفع المتجر (النشر)

### Render
1. ارفع المشروع إلى GitHub.
2. في [render.com](https://render.com): New → Web Service وربط المستودع.
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. في **Environment** أضف المتغيرات من `.env` (BASE_URL, MOYASAR_SECRET_KEY, GOOGLE_ANALYTICS_ID, إلخ).

### Railway / VPS
نفس الفكرة: تشغيل `npm start` وإضافة متغيرات البيئة كما في `.env.example`.

---

## واجهة الباك إند (API)

| الطريقة | المسار | الوصف |
|--------|--------|--------|
| GET | `/api/config` | إعدادات المتجر (دفع، شحن، GA) |
| GET | `/api/shipping/options` | خيارات الشحن |
| POST | `/api/order` | إنشاء طلب (مع الشحن) |
| POST | `/api/create-payment` | إنشاء رابط دفع Moyasar |
| POST | `/api/payment/callback` | استدعاء Moyasar بعد الدفع |
| GET | `/api/orders` | قائمة الطلبات |

---

## الملفات

- `index.html` — واجهة المتجر
- `styles.css` — التنسيقات
- `script.js` — السلة، الشحن، والدفع
- `server.js` — الباك إند (طلبات، دفع، شحن)
- `data/orders.json` — حفظ الطلبات
- `.env.example` — مثال لمتغيرات البيئة
