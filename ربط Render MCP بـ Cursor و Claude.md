# ربط خادم Render MCP بتطبيقات الذكاء الاصطناعي (Cursor و Claude Code)

يتيح **Render MCP Server** لـ Cursor و Claude Code التحكم في استضافتك على Render وتحليل **سجلات البناء (Build Logs)** وتشخيص الأعطال باستخدام **تعليمات باللغة الطبيعية**.

---

## ما الذي يمكنك فعله بعد الربط؟

- **تحليل سجلات البناء:** طلب "اعرض آخر سجلات البناء لخدمة hayat-store" أو "لماذا فشل آخر نشر؟"
- **تشخيص الأعطال:** "اسحب آخر 50 سطراً من سجلات الأخطاء لـ API الخاص بي"
- **عرض المقاييس:** استهلاك CPU والذاكرة وحركة HTTP
- **إدارة الخدمات:** عرض الخدمات، تفاصيل النشر، تحديث متغيرات البيئة
- **استعلام قواعد البيانات:** إن وُجدت (مثل Render Postgres)

---

## الخطوة ١ — إنشاء مفتاح API من Render

1. ادخل إلى **[Render Dashboard](https://dashboard.render.com/)** وسجّل الدخول.
2. من القائمة: **Account Settings** (أو [dashboard.render.com/settings#api-keys](https://dashboard.render.com/settings#api-keys)).
3. في قسم **API Keys** اضغط **Create API Key**.
4. أعطِ المفتاح اسماً (مثل `cursor-mcp`) واحفظ المفتاح في مكان آمن — **لن يُعرض مرة أخرى**.

> المفتاح يمنح صلاحية واسعة لحسابك؛ لا تشاركه. خادم Render MCP لا يحذف خدمات أو قواعد بيانات، ويقتصر التعديل على متغيرات البيئة.

---

## الخطوة ٢ — إعداد Cursor

### مسار ملف الإعداد (Windows)

الملف يكون عادةً في:

```
C:\Users\<اسم_المستخدم>\.cursor\mcp.json
```

مثال: `C:\Users\hardw\.cursor\mcp.json`

إن لم يكن المجلد أو الملف موجوداً، أنشئ المجلد `.cursor` والملف `mcp.json` يدوياً.

### محتوى `mcp.json`

افتح (أو أنشئ) الملف `mcp.json` وضع التالي، مع **استبدال** `YOUR_RENDER_API_KEY` بمفتاحك الفعلي:

```json
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_RENDER_API_KEY"
      }
    }
  }
}
```

مثال بعد الاستبدال:

```json
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer rnd_xxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

احفظ الملف ثم **أعد تشغيل Cursor** حتى تُحمّل الإعدادات.

### تحديد مساحة العمل (Workspace) في Cursor

بعد فتح Cursor اكتب لأداة الذكاء مثلاً:

- **"Set my Render workspace to [اسم الـ workspace]"**

أو اطلب: **"اعرض قائمة مساحات العمل لدي على Render"** ثم اختر الاسم المناسب. بدون تحديد الـ workspace قد يطلب منك التطبيق تحديده عند أول طلب يتعلق بـ Render.

---

## الخطوة ٣ — إعداد Claude Code

من الطرفية (Terminal) نفّذ الأمر التالي بعد استبدال `YOUR_RENDER_API_KEY` بمفتاحك:

```bash
claude mcp add --transport http render https://mcp.render.com/mcp --header "Authorization: Bearer YOUR_RENDER_API_KEY"
```

للتحديد أين يُحفظ الإعداد (مثلاً لمشروع معيّن) يمكنك استخدام `--scope`. للتفاصيل راجع [توثيق Claude Code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp).

ثم حدّد مساحة العمل بنفس الطريقة (اختيار الـ workspace الذي فيه خدمة متجرك).

---

## أمثلة أوامر باللغة الطبيعية (تحليل البناء وتصحيح الأخطاء)

يمكنك استخدام جمل مثل التالية في Cursor أو Claude بعد الربط:

| الهدف | مثال أمر |
|--------|----------|
| سجلات البناء | **"اعرض آخر سجلات البناء لخدمة hayat-store"** |
| أخطاء النشر | **"لماذا فشل آخر نشر لـ hayat-store؟"** أو **"Pull the most recent error-level logs for my API service"** |
| تشخيص الموقع | **"Why isn't my site at hayat-store.onrender.com working?"** |
| سجلات الأخطاء | **"اسحب آخر 50 سطراً من سجلات الأخطاء لخدمة الإنتاج"** |
| المقاييس | **"ما ذروة استهلاك CPU لخدمة الويب في آخر 24 ساعة؟"** |
| قائمة الخدمات | **"List my Render services"** أو **"اعرض خدماتي على Render"** |
| تفاصيل النشر | **"اعرض سجل النشرات (deploy history) لخدمة hayat-store"** |

---

## استكشاف الأخطاء

| المشكلة | ما يمكن فعله |
|---------|----------------|
| خادم Render لا يظهر في Cursor | تأكد من مسار وحروف `mcp.json`، ثم أعد تشغيل Cursor. |
| "Unauthorized" أو رفض الطلبات | تحقق أن المفتاح صحيح ومُدرج في `Authorization: Bearer ...` بدون مسافات زائدة. |
| الأدوات ظاهرة لكن الذكاء لا يستخدمها | اطلب صراحة: "استخدم أدوات Render MCP لسحب سجلات البناء لخدمة hayat-store". |
| لا تظهر بيانات الخدمة | حدّد الـ workspace أولاً: "Set my Render workspace to [الاسم]". |

---

## مراجع

- [Render MCP Server — التوثيق الرسمي](https://render.com/docs/mcp-server)
- [إنشاء مفتاح API على Render](https://dashboard.render.com/settings#api-keys)
- [Cursor MCP Documentation](https://docs.cursor.com/context/mcp)
- [Claude Code — MCP](https://docs.anthropic.com/en/docs/claude-code/mcp)
