@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18 or newer is required. Install it from https://nodejs.org/ and reopen this file.
  pause
  exit /b 1
)
start "BEAST Creative Studio Server" cmd /k "set BEAST_NO_OPEN=1&& npm run dv"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:4317
