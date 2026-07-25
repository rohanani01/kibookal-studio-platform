@echo off
REM ============================================================
REM  Kibookal Studio v3.0 - start the Workflow launcher
REM  Uses the EXISTING launcher at D:\kibookal-workflow-launcher
REM  AS-IS (not rebuilt). AUTH_DISABLED=true keeps the admin
REM  session always open, so no manual login is ever needed.
REM  It then appears inside Studio under the "Workflow" tab,
REM  and its outputs sync to the Gallery (run START-WORKFLOW-SYNC.bat).
REM ============================================================
set "LAUNCHER=D:\kibookal-workflow-launcher"

if not exist "%LAUNCHER%" (
  echo X Launcher not found at %LAUNCHER%
  pause
  exit /b 1
)

echo Starting Workflow launcher (admin session kept open, no login)...
start "Kibookal Workflow Backend" cmd /k "cd /d %LAUNCHER%\backend && set AUTH_DISABLED=true && npm start"
timeout /t 3 /nobreak >nul
start "Kibookal Workflow Frontend" cmd /k "cd /d %LAUNCHER%\frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo Starting Workflow -^> Gallery sync...
start "Kibookal Workflow Sync" cmd /k "cd /d %~dp0kibookal-gallery && node scripts/workflow-to-gallery.js"
timeout /t 1 /nobreak >nul

echo.
echo ========================================
echo   Workflow launcher is starting
echo ========================================
echo   Backend : http://localhost:8899
echo   Frontend: http://localhost:5174
echo.
echo   It embeds inside Studio under the "Workflow" tab.
echo   Login is disabled (AUTH_DISABLED=true) so it is always ready.
echo.
