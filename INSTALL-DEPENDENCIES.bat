@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Web 3 Browser - Dependency Installer

set "npm_config_registry=https://registry.npmjs.org/"
set "npm_config_include=dev"
set "npm_config_fund=false"
set "npm_config_audit=false"
set "npm_config_fetch_retries=4"
set "npm_config_fetch_retry_mintimeout=20000"
set "npm_config_fetch_retry_maxtimeout=120000"
set "NODE_ENV=development"

if exist node_modules\.web3-install-complete del /f /q node_modules\.web3-install-complete >nul 2>nul

echo ============================================================
echo   Installing and repairing JavaScript dependencies
echo ============================================================
echo.
echo Registry: %npm_config_registry%
echo Development tools: forced ON
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found.
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found.
  exit /b 1
)

rem --include=dev overrides a global omit=dev or NODE_ENV=production setting.
rem Without this flag npm may install only the 64 runtime packages and omit
rem Tailwind, PostCSS, TypeScript, and the Tauri CLI.
call npm install --include=dev --registry=https://registry.npmjs.org/ --no-audit --no-fund
if errorlevel 1 goto :install_failed

if exist .next (
  echo Clearing the old Next.js cache...
  rmdir /s /q .next >nul 2>nul
)

if not exist node_modules mkdir node_modules
>node_modules\.web3-install-complete echo v0.3.4 dependencies verified

node scripts\check-dependencies.cjs
if errorlevel 1 (
  del /f /q node_modules\.web3-install-complete >nul 2>nul
  echo.
  echo ERROR: npm finished, but required packages are still missing.
  echo Run: npm config get omit
  echo If it prints dev, this launcher already overrides it with --include=dev.
  echo Close programs using this folder, then run REPAIR-INSTALL.bat once.
  exit /b 1
)

exit /b 0

:install_failed
echo.
echo ERROR: Dependency installation failed.
echo.
echo Close Web 3 Browser and terminals using this folder.
echo Then run REPAIR-INSTALL.bat.
exit /b 1
