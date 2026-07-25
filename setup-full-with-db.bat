@echo off
REM Optional: install DB support (better-sqlite3)
REM Requires Visual Studio Build Tools with C++ workload installed first.
REM Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/

echo.
echo ========================================
echo   Install DB Support (better-sqlite3)
echo ========================================
echo.
echo This requires Visual Studio Build Tools.
echo If you have not installed them yet, cancel (Ctrl+C) and:
echo   1. Download from https://visualstudio.microsoft.com/visual-cpp-build-tools/
echo   2. Install with "Desktop development with C++" workload
echo   3. Reboot
echo   4. Re-run this script
echo.
pause

cd /d "%~dp0"
call npm install better-sqlite3 --no-audit --no-fund
if errorlevel 1 (
  echo X Install failed. See above.
  pause
  exit /b 1
)

echo.
echo Now initialising database...
call npm run db:migrate

echo.
echo OK Done. Restart the backend with: npm run backend
pause
