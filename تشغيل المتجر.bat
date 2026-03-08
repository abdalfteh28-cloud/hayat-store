@echo off
chcp 65001 >nul
cd /d "%~dp0"
title متجر حياة

:: إضافة Node.js إلى المسار إن وُجد في المجلدات المعتادة
set "NODEDIR="
if exist "C:\Program Files\nodejs\node.exe" set "NODEDIR=C:\Program Files\nodejs"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODEDIR=%ProgramFiles(x86)%\nodejs"
if exist "%LOCALAPPDATA%\Programs\node\node.exe" set "NODEDIR=%LOCALAPPDATA%\Programs\node"
if defined NODEDIR set "PATH=%NODEDIR%;%PATH%"

:: التحقق أن node يعمل
node -v >nul 2>nul
if errorlevel 1 (
  echo.
  echo  ═══════════════════════════════════════════════════
  echo   Node.js غير مثبت على جهازك
  echo  ═══════════════════════════════════════════════════
  echo.
  echo   لتشغيل المتجر تحتاج تثبيت Node.js مرة واحدة:
  echo.
  echo   1. سيفتح معك صفحة التحميل الآن
  echo   2. حمّل الملف وثبّت Node.js (Next حتى النهاية)
  echo   3. أعد تشغيل هذا الملف "تشغيل المتجر.bat"
  echo.
  echo  ═══════════════════════════════════════════════════
  start https://nodejs.org/ar/download/
  timeout /t 5
  pause
  set "NODEDIR="
  exit /b 0
)

echo.
echo  ═══════════════════════════════════════════════════
echo   متجر حياة — تشغيل السيرفر
echo  ═══════════════════════════════════════════════════
echo.

if not exist "node_modules" (
  echo  جاري تثبيت الحزم لأول مرة...
  if defined NODEDIR (
    call "%NODEDIR%\npm.cmd" install
  ) else (
    call npm install
  )
  if errorlevel 1 (
    echo  فشل التثبيت. جرّب تشغيل الملف مرة ثانية.
    pause
    exit /b 1
  )
  echo.
)

echo  السيرفر يعمل.
echo.
echo  افتح المتصفح على:  http://localhost:3000
echo.
echo  لإيقاف السيرفر: اضغط Ctrl+C ثم أغلق النافذة
echo  ═══════════════════════════════════════════════════
echo.

start "" "http://localhost:3000"

node server.js
if errorlevel 1 (
  echo.
  echo  حدث خطأ في تشغيل السيرفر. تحقق من ظهور رسالة فوق.
  pause
)
pause
