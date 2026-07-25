@echo off
REM Kibookal Studio Platform — one-click setup for Windows

echo.
echo ========================================
echo   Kibookal Studio Platform - Setup
echo ========================================
echo.

cd /d "%~dp0"

echo Cleaning any previous broken install...
if exist node_modules rmdir /s /q node_modules 2>nul
if exist package-lock.json del /f /q package-lock.json 2>nul
echo.

echo Step 1/4: Installing required dependencies...
echo   (express, cors, multer, dotenv, http-server)
echo   Skipping optional native packages to avoid compiler errors.
echo.
call npm install --no-optional --no-audit --no-fund
if errorlevel 1 (
  echo.
  echo X npm install failed. See error above.
  pause
  exit /b 1
)

echo.
echo Step 2/4: Copying .env from template...
if not exist .env (
  copy .env.example .env >nul
  echo OK .env created
) else (
  echo OK .env already exists
)

echo.
echo Step 3/4: Initialising database (if available)...
call npm run db:migrate

echo.
echo Step 4/4: Running health check...
call npm run health

echo.
echo ========================================
echo   Setup complete!
echo ========================================
echo.
echo To start the studio, double-click start.bat
echo Or manually run:
echo   - Backend:  npm run backend
echo   - Frontend: npm run frontend
echo.
echo Then open: http://localhost:8770
echo.
pause
