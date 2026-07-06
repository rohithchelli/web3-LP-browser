@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Web 3 Browser - UI Preview Only
set "npm_config_registry=https://registry.npmjs.org/"

echo ============================================================
echo   UI PREVIEW ONLY - NOT THE FUNCTIONAL DESKTOP BROWSER
 echo ============================================================
echo.
echo This mode runs in an ordinary browser and therefore uses an iframe.
echo For the native desktop browser, close this window and run START-BROWSER.bat.
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  pause
  exit /b 1
)

if not exist node_modules\.web3-install-complete (
  call "%~dp0INSTALL-DEPENDENCIES.bat"
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

call npm run dev
if errorlevel 1 pause
endlocal
