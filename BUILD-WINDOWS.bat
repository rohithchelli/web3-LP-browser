@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Web 3 Browser - Windows Build
set "RUST_BACKTRACE=1"
set "npm_config_registry=https://registry.npmjs.org/"

where node >nul 2>nul || goto :missing
where cargo >nul 2>nul || goto :missing

if not exist node_modules\.web3-install-complete (
  call "%~dp0INSTALL-DEPENDENCIES.bat"
  if errorlevel 1 goto :failed
)

call npm run typecheck
if errorlevel 1 goto :failed
call npm run test:navigation
if errorlevel 1 goto :failed
call npm run test:native-wiring
if errorlevel 1 goto :failed
call npm run test:shields
if errorlevel 1 goto :failed
call npm run tauri:build
if errorlevel 1 goto :failed

echo.
echo Build completed. Installer files are under:
echo src-tauri\target\release\bundle\
pause
exit /b 0

:missing
echo Node.js and Rust/Cargo are required.
:failed
echo.
echo Build failed. Read the FIRST error above.
pause
exit /b 1
