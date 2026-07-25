@echo off
REM ============================================================
REM  Kibookal Studio v3.0  -  RUN (the correct way)
REM
REM  IMPORTANT: this app MUST be served over http.
REM  Double-clicking frontend\index.html (file://) breaks it,
REM  because its CSS and engine data load via fetch(), which the
REM  file:// protocol blocks. This script serves it properly.
REM
REM  It opens at:  http://localhost:8770
REM  Keep the popped-up server window open while you use it.
REM ============================================================
cd /d "%~dp0"

echo.
echo   Starting Kibookal Studio v3.0  ...
echo   URL:  http://localhost:8770
echo.

start "Kibookal Studio v3.0 (server - keep open)" cmd /k "node "%~dp0node_modules\http-server\bin\http-server" "%~dp0frontend" -p 8770 -c-1"

timeout /t 2 /nobreak >nul
start "" "http://localhost:8770"

echo   Browser opening. If it did not, go to http://localhost:8770 manually.
echo   To stop the studio, close the "server - keep open" window.
echo.
