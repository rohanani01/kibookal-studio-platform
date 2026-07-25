@echo off
REM Kibookal Studio Platform — start both backend and frontend
cd /d "%~dp0"

echo.
echo ========================================
echo   Starting Kibookal Studio Platform
echo ========================================
echo.

REM Check if node_modules exists first
if not exist node_modules (
  echo X node_modules not found. Run setup.bat first.
  pause
  exit /b 1
)

echo Starting backend on port 3001...
start "Kibookal Backend" cmd /k "cd /d %~dp0 && npm run backend"

REM Wait 2 seconds so backend prints its banner first
timeout /t 2 /nobreak >nul

echo Starting frontend on port 8770...
start "Kibookal Frontend" cmd /k "cd /d %~dp0 && npm run frontend"

REM Wait 4 seconds for both to spin up
timeout /t 4 /nobreak >nul

echo Opening browser...
start "" "http://localhost:8770"

echo.
echo ========================================
echo   Both servers running in separate windows
echo ========================================
echo.
echo - Studio:  http://localhost:8770
echo - API:     http://localhost:3001/api/health
echo.
echo Close those CMD windows to stop the servers.
echo.
pause
