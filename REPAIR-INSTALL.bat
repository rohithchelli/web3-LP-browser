@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Web 3 Browser - Repair Dependency Installation

set "npm_config_registry=https://registry.npmjs.org/"
set "npm_config_include=dev"
set "NODE_ENV=development"

echo ============================================================
echo   Repairing the dependency installation safely
 echo ============================================================
echo.
echo Close Web 3 Browser and every terminal running this project.
echo Stop any VS Code task that is using this folder.
echo.
pause

if exist node_modules\.web3-install-complete del /f /q node_modules\.web3-install-complete >nul 2>nul
if exist .next (
  echo Removing the stale Next.js cache...
  rmdir /s /q .next >nul 2>nul
)

echo Repairing packages in place with development tools enabled...
call "%~dp0INSTALL-DEPENDENCIES.bat"
if not errorlevel 1 goto :success

echo.
echo The in-place repair failed. Attempting to rename the locked folder...
set "OLD_MODULES=node_modules.old.%RANDOM%"
if exist node_modules ren node_modules "%OLD_MODULES%" >nul 2>nul
if exist node_modules (
  echo.
  echo ERROR: Windows is still locking node_modules.
  echo Restart Windows, extract this ZIP to C:\Web3Browser034, and run START-BROWSER.bat there.
  pause
  exit /b 1
)

call "%~dp0INSTALL-DEPENDENCIES.bat"
if errorlevel 1 (
  echo.
  echo ERROR: Repair installation failed. Read the first npm error above.
  pause
  exit /b 1
)

:success
echo.
echo Repair completed successfully. Run START-BROWSER.bat.
pause
exit /b 0
