@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Web 3 Browser - Missing Module Fix

echo Repairing all build dependencies, including Tailwind and PostCSS...
call "%~dp0INSTALL-DEPENDENCIES.bat"
if errorlevel 1 goto :failed

echo.
echo Fixed successfully. Run START-BROWSER.bat.
pause
exit /b 0

:failed
echo.
echo Quick repair failed. Close programs using this folder and run REPAIR-INSTALL.bat.
pause
exit /b 1
