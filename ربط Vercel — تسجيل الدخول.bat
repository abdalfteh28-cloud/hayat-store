@echo off
chcp 65001 >nul
title ربط المشروع بـ Vercel — تسجيل الدخول

echo.
echo ========================================
echo   ربط المشروع بـ Vercel
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [خطأ] Node.js غير موجود في المسار. ثبّت Node.js من https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] تثبيت الاعتماديات إن لزم...
call npm install
if errorlevel 1 (
    echo [خطأ] فشل npm install
    pause
    exit /b 1
)

echo.
echo [2/3] تسجيل الدخول إلى Vercel
echo       ستُفتح المتصفح أو يظهر رابط — سجّل الدخول بحسابك.
echo.
call npx vercel login
if errorlevel 1 (
    echo [خطأ] فشل تسجيل الدخول
    pause
    exit /b 1
)

echo.
echo [3/3] ربط هذا المشروع بحسابك على Vercel
echo       اختر الفريق/المشروع أو أنشئ مشروعاً جديداً.
echo.
call npx vercel link
if errorlevel 1 (
    echo [تحذير] إما ألغيت الربط أو حدث خطأ. يمكنك تشغيل هذا الملف لاحقاً.
    pause
    exit /b 0
)

echo.
echo ========================================
echo   تم الربط بنجاح.
echo   للرفع: npm run vercel   أو  npm run vercel:deploy
echo ========================================
echo.
pause
