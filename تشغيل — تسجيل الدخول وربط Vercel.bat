@echo off
chcp 65001 >nul
title تسجيل الدخول وربط Vercel

cd /d "%~dp0"

echo.
echo ============================================
echo   تسجيل الدخول وربط المشروع بـ Vercel
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [خطأ] Node.js غير موجود. ثبّته من https://nodejs.org
    pause
    exit /b 1
)

echo [1] تثبيت الاعتماديات...
call npm install
if errorlevel 1 (
    echo [خطأ] فشل npm install
    pause
    exit /b 1
)

echo.
echo [2] تسجيل الدخول — ستُفتح المتصفح أو يظهر رابط أدناه
echo     افتح الرابط وسجّل الدخول، ثم ارجع هنا واضغط Enter
echo.
call npx vercel login
if errorlevel 1 (
    echo [خطأ] فشل تسجيل الدخول
    pause
    exit /b 1
)

echo.
echo [3] ربط المشروع — اختر الفريق/المشروع أو أنشئ جديداً
echo.
call npx vercel link
if errorlevel 1 (
    echo [تحذير] تم إلغاء الربط أو حدث خطأ. شغّل الملف مرة أخرى لاحقاً.
    pause
    exit /b 0
)

echo.
echo ============================================
echo   تم الربط بنجاح.
echo   للرفع: استخدم /vercel-deploy في Cursor
echo   أو: npm run vercel  /  npm run vercel:deploy
echo ============================================
pause
