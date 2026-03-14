# ربط شركات الشحن الحقيقية — أرامكس، إم إس إم إس، DHL، ريد بوكس

متجر حياة يدعم إظهار خيارات توصيل من عدة شركات. يمكنك تفعيل كل شركة وإدخال بيانات الحساب من **لوحة التحكم → إعدادات المتجر → بوابات الشحن**.

---

## ما تم إضافته

- **قسم بوابات الشحن** في الإعدادات: تفعيل وإدخال بيانات (أرامكس، إم إس إم إس، DHL، ريد بوكس).
- **خيارات التوصيل** في صفحة الطلب: تظهر دائماً "توصيل عادي" و"توصيل سريع" (من أسعار الإعدادات)، وإذا فعّلت شركة شحن وتعبئة بياناتها تظهر خيارات إضافية من تلك الشركة (حالياً أسعار تجريبية حتى ربط الـ API الحقيقي).

---

## 1. أرامكس (Aramex)

| المطلوب | أين تحصل عليه |
|---------|----------------|
| **Username** | من لوحة أرامكس بعد طلب تفعيل الـ API |
| **Password** | من أرامكس |
| **Account Number** | رقم حسابك |
| **Account PIN** | من أرامكس |
| **Account Entity** | عادةً `SAU` للسعودية |

**كيف تحصل على الوصول:**
- مركز المطورين: [Aramex Developers](https://www.aramex.com/us/en/developers-solution-center/aramex-apis)
- تواصل مع فريق المبيعات/الدعم لأرامكس واطلب تفعيل **Rate Calculator API** و **Shipping Services API**.
- الوثائق: [Aramex Shipping Services API Manual (PDF)](https://www.aramex.com/docs/default-source/resourses/resourcesdata/shipping-services-api-manual.pdf)

**ملاحظة:** التكامل الحالي يعرض خيارين تجريبيين (عادي/سريع). لربط الأسعار الحقيقية يُستدعى Rate Calculator API من الملف `shipping-carriers.js` (دالة `getAramexRates`).

---

## 2. إم إس إم إس (SMSA Express)

| المطلوب | أين تحصل عليه |
|---------|----------------|
| **API Key** | من إم إس إم إس بعد فتح حساب وتفعيل التكامل |
| **Account Number** | رقم حسابك |
| **Pass Key** | من إم إس إم إس |

**كيف تحصل على الوصول:**
- البريد: **fsaid@smsaexpress.com** أو **info@smsaexpress.com**
- الهاتف: **+966-9200-09999**
- إم إس إم إس توفّر تكامل REST API وتُصدر للمتاجر مفتاح API بعد الاتفاق.

**ملاحظة:** التكامل الحالي يعرض خيارين تجريبيين. لربط الأسعار الحقيقية يُضاف استدعاء API إم إس إم إس داخل `getSMSARates` في `shipping-carriers.js`.

---

## 3. DHL Express

| المطلوب | أين تحصل عليه |
|---------|----------------|
| **API Key** | من بوابة DHL للمطورين بعد إنشاء تطبيق |
| **Account Number** | رقم حساب DHL Express |

**كيف تحصل على الوصول:**
- بوابة المطورين: [DHL Developer Portal](https://developer.dhl.com/)
- واجهة **MyDHL API (DHL Express)**: [MyDHL API](https://developer.dhl.com/api-reference/dhl-express-mydhl-api)
- تحتاج حساب عميل DHL Express ثم تسجيل تطبيق للحصول على API Key واستخدام خدمة **Rating** لأسعار التوصيل.

**ملاحظة:** التكامل الحالي يعرض خيارين تجريبيين (إكسبريس/اقتصادي). لربط الأسعار الحقيقية يُستدعى DHL Rating API من دالة `getDHLRates` في `shipping-carriers.js`.

---

## 4. ريد بوكس (RedBox)

| المطلوب | أين تحصل عليه |
|---------|----------------|
| **API Key** | من ريد بوكس بعد اتفاق التكامل |
| **Merchant ID** | معرف التاجر لديكم |

**كيف تحصل على الوصول:**
- دعم التكامل: [RedBox Integrations](https://support.redbox.systems/docs/redbox-integrations)
- مساعدة التاجر: [RedBox Merchant Help](https://redboxsa.freshdesk.com/en/support/solutions)
- تواصل مع ريد بوكس للحصول على وثائق الـ API ومفاتيح التكامل.

**ملاحظة:** التكامل الحالي يعرض خياراً تجريبياً واحداً. لربط الأسعار الحقيقية يُضاف استدعاء API ريد بوكس داخل `getRedBoxRates` في `shipping-carriers.js`.

---

## أين تُعدّل الكود لربط الـ API الحقيقي؟

الملف الرئيسي: **`shipping-carriers.js`** في جذر المشروع.

- **أرامكس:** الدالة `getAramexRates(cfg, params)` — أضف استدعاء Rate Calculator (عادةً XML/SOAP) واربط النتيجة بالشكل `{ id, carrier, label, labelEn, price, days }`.
- **إم إس إم إس:** الدالة `getSMSARates(cfg, params)` — أضف استدعاء REST API إم إس إم إس واربط النتيجة بنفس الشكل.
- **DHL:** الدالة `getDHLRates(cfg, params)` — أضف استدعاء MyDHL Rating API واربط النتيجة بنفس الشكل.
- **ريد بوكس:** الدالة `getRedBoxRates(cfg, params)` — أضف استدعاء API ريد بوكس واربط النتيجة بنفس الشكل.

المتغير `params` يمكن أن يحتوي على `weight` (كجم)، `city`، `country` لاستخدامها في طلب السعر من كل شركة.

---

## ملخص

| الشركة | تفعيل من لوحة التحكم | بيانات الحساب في الإعدادات | ربط API الحقيقي |
|--------|----------------------|-----------------------------|------------------|
| أرامكس | ✅ | Username, Password, Account Number, PIN, Entity | في `getAramexRates` في `shipping-carriers.js` |
| إم إس إم إس | ✅ | API Key, Account Number, Pass Key | في `getSMSARates` |
| DHL | ✅ | API Key, Account Number | في `getDHLRates` |
| ريد بوكس | ✅ | API Key, Merchant ID | في `getRedBoxRates` |

بعد ربط أي شركة بالـ API الحقيقي، استبدل القيم التجريبية في الدالة المناسبة بتحويل ردّ الـ API إلى مصفوفة من العناصر `{ id, carrier, label, labelEn, price, days }`.
