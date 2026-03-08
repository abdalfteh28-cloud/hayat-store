# إصلاح النشر على Render — استخدم Web Service وليس Static Site

## المشكلة

الرابط الذي تستخدمه يحتوي على **`/static/`**:
```
https://dashboard.render.com/static/srv-d6mfkg5actks7381q9dg/settings
```

هذا يعني أنك أنشأت خدمة من نوع **Static Site** (موقع ثابت). متجر حياة يعمل بـ **Node.js** (سيرفر Express) ويحتاج **Web Service** (خدمة ويب)، لذلك تظهر أخطاء مثل:
- "مجلد الجذر npm install غير موجود"
- "الدليل المنتشر npm غير موجود"

**الحل:** إنشاء خدمة جديدة من نوع **Web Service** وربطها بنفس المستودع.

---

## الخطوات (اتبعها بالترتيب)

### ١) إنشاء خدمة ويب جديدة (وليس تعديل الحالية)

1. ادخل إلى **[Render Dashboard](https://dashboard.render.com/)**
2. اضغط **New +** (أعلى اليسار) ثم اختر **Web Service** — **ليس** Static Site.
3. في "Connect a repository" اختر المستودع **abdalfteh28-cloud/hayat-store** (أو "متجر الحياة"). إن لم يظهر، اضغط "Configure account" وربط GitHub ثم اختر المستودع.

### ٢) إعدادات الخدمة (انسخ كما هي)

| الحقل | القيمة |
|--------|--------|
| **Name** | `hayat-store` (أو أي اسم تريده) |
| **Region** | اختر الأقرب (مثل Frankfurt) |
| **Branch** | `main` |
| **Root Directory** | **اتركه فارغاً** — لا تكتب شيئاً |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (إن وُجد) |

**لا يوجد حقل "Publish Directory" في Web Service** — إن رأيته فأنت في نوع خدمة خاطئ.

### ٣) متغيرات البيئة (Environment)

قبل أو بعد النشر، من تبويب **Environment** أضف:

| Key | Value |
|-----|--------|
| `NODE_VERSION` | `18` |
| `BASE_URL` | `https://hayat-store.onrender.com` (غيّره لرابط خدمتك الفعلي بعد النشر) |
| `MOYASAR_SECRET_KEY` | مفتاحك من [Moyasar](https://moyasar.com) |

### ٤) إنشاء الخدمة

اضغط **Create Web Service**. انتظر حتى ينتهي البناء والنشر (عدة دقائق).

### ٥) بعد النشر

- Render سيعطيك رابطاً مثل: `https://hayat-store.onrender.com`
- ادخل **Environment** وحدّث `BASE_URL` بهذا الرابط (بدون `/` في النهاية).
- افتح الرابط في المتصفح — يجب أن تظهر صفحة المتجر.

---

## ماذا تفعل بالخدمة القديمة (Static Site)؟

يمكنك **حذفها** من Render لأنها لن تعمل مع هذا المشروع:
- من لوحة الخدمة القديمة → **Settings** → أسفل الصفحة **Delete Web Service** (أو Delete Static Site).

أو اتركها إن أردت؛ المهم أن تستخدم الرابط الجديد من **Web Service** الجديدة.

---

## ملخص

| كان (خطأ) | المطلوب (صح) |
|-----------|----------------|
| Static Site | **Web Service** |
| Publish Directory مطلوب | لا يوجد — Build + Start فقط |
| Root Directory = npm install | Root Directory = **فارغ** |
| Build = ؟ | **npm install** |
| Start = ؟ | **npm start** |

بعد إنشاء **Web Service** الجديدة وربط المستودع بنفس الإعدادات أعلاه، النشر يتم تلقائياً والأخطاء تختفي.
