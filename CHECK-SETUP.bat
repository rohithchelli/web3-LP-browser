@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Web 3 Browser - Setup Check

set "FAILED=0"
echo ============================================================
echo   Web 3 Browser prerequisite check
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [FAIL] Node.js was not found.
  set "FAILED=1"
) else (
  for /f "delims=" %%V in ('node --version') do echo [PASS] Node.js %%V
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [FAIL] npm was not found.
  set "FAILED=1"
) else (
  for /f "delims=" %%V in ('npm --version') do echo [PASS] npm %%V
)

where rustc >nul 2>nul
if errorlevel 1 (
  echo [FAIL] rustc was not found. Install Rust with rustup.
  set "FAILED=1"
) else (
  for /f "delims=" %%V in ('rustc --version') do echo [PASS] %%V
)

where cargo >nul 2>nul
if errorlevel 1 (
  echo [FAIL] cargo was not found.
  set "FAILED=1"
) else (
  for /f "delims=" %%V in ('cargo --version') do echo [PASS] %%V
)

set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
if exist "%VSWHERE%" (
  "%VSWHERE%" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath >nul 2>nul
  if errorlevel 1 (
    echo [WARN] Microsoft C++ Build Tools were not detected.
    echo        Install Visual Studio Build Tools and select Desktop development with C++.
  ) else (
    echo [PASS] Microsoft C++ Build Tools detected.
  )
) else (
  echo [WARN] Visual Studio Installer was not detected.
  echo        Tauri on Windows requires Microsoft C++ Build Tools.
)

if exist package-lock.json (
  echo [PASS] package-lock.json is present.
) else (
  echo [WARN] package-lock.json is missing; npm install will be used.
)

if exist src-tauri\tauri.conf.json (
  echo [PASS] Tauri configuration is present.
) else (
  echo [FAIL] src-tauri\tauri.conf.json is missing.
  set "FAILED=1"
)

echo.
if "%FAILED%"=="0" (
  echo Core checks passed. Run START-BROWSER.bat.
) else (
  echo One or more required tools are missing. Fix the FAIL items first.
)
echo.
pause
exit /b %FAILED%
