@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Web 3 Browser - Desktop Launcher

set "RUST_BACKTRACE=1"
set "npm_config_registry=https://registry.npmjs.org/"

echo ============================================================
echo   Web 3 Browser - native Tauri desktop mode
echo ============================================================
echo.

echo [1/5] Checking Node.js...
where node >nul 2>nul
if errorlevel 1 goto :missing_node
for /f %%V in ('node -p "Number(process.versions.node.split('.')[0])"') do set "NODE_MAJOR=%%V"
if %NODE_MAJOR% LSS 20 (
  echo ERROR: Node.js 20 or newer is required. Installed major version: %NODE_MAJOR%
  goto :failed
)

echo [2/5] Checking Rust...
where rustc >nul 2>nul
if errorlevel 1 goto :missing_rust
where cargo >nul 2>nul
if errorlevel 1 goto :missing_rust

echo [3/5] Checking dependency integrity...
node scripts\check-dependencies.cjs --quiet >nul 2>nul
if errorlevel 1 (
  echo Missing or incomplete packages detected. Repairing now...
  call "%~dp0INSTALL-DEPENDENCIES.bat"
  if errorlevel 1 goto :failed
) else (
  echo Dependencies are complete.
)

echo [4/5] Clearing stale Next.js cache when needed...
if exist .next\dev rmdir /s /q .next >nul 2>nul

echo [5/5] Starting the native desktop browser...
echo.
call npm run tauri:dev
if errorlevel 1 (
  echo.
  echo ERROR: Tauri could not start. Read the FIRST error above.
  echo Run CHECK-SETUP.bat for prerequisite checks.
  goto :failed
)

goto :done

:missing_node
echo ERROR: Node.js is not installed or is not available on PATH.
echo Install Node.js 20 or newer, reopen this folder, and run START-BROWSER.bat again.
goto :failed

:missing_rust
echo ERROR: Rust is not installed or is not available on PATH.
echo Install Rust with rustup using the stable MSVC toolchain.
echo Required command after installation: rustup default stable-msvc
goto :failed

:failed
echo.
pause
exit /b 1

:done
endlocal
