@echo off
title Kibookal Studio v3.0 - START EVERYTHING
cd /d "%~dp0"
echo ============================================
echo   KIBOOKAL STUDIO v3.0 - starting everything
echo   (backend 3001 + frontend 8770 + gallery 4000)
echo ============================================
echo.

if not exist node_modules (
  echo X node_modules not found. Run setup.bat first.
  pause
  exit /b 1
)

REM 1) Backend (port 3001) - same as start.bat
echo Starting backend (port 3001)...
start "Kibookal Backend" cmd /k "cd /d %~dp0 && npm run backend"
timeout /t 2 /nobreak >nul

REM 2) Frontend - the UPDATED UI - served on 8770 with no-cache, exactly like start.bat
echo Starting Studio v3 frontend (port 8770)...
start "Kibookal Frontend" cmd /k "cd /d %~dp0 && npm run frontend"

REM 3) Gallery server (port 4000)
echo Starting Gallery server (port 4000)...
start "Kibookal Gallery" cmd /k "cd /d %~dp0kibookal-gallery && node server\server.js"

REM 4) Wait, then open the SAME url start.bat uses (8770)
echo.
echo Waiting for servers to boot...
timeout /t 6 /nobreak >nul
echo Opening Studio in your browser...
start "" "http://localhost:8770"

echo.
echo ============================================
echo   DONE.
echo   - Studio:  http://localhost:8770
echo   - Gallery: http://localhost:4000
echo   - API:     http://localhost:3001/api/health
echo   Three server windows opened. Close them to stop.
echo ============================================
echo.
echo This launcher window can be closed.
timeout /t 4 /nobreak >nul
