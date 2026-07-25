@echo off
REM ============================================================
REM  Kibookal Studio v3.0  -  RUN the Gallery website
REM  Serves the nested gallery repo on http://localhost:4000
REM  The Studio "Gallery" tab embeds this automatically, and
REM  every render syncs here (incl. the new Workflow facet).
REM
REM  NOTE: if your OLD gallery is still on port 4000, close that
REM  window first (this is the v3 copy that has the new features).
REM ============================================================
cd /d "%~dp0kibookal-gallery"

echo.
echo   Starting Kibookal Gallery v3.0  ...
echo   URL:  http://localhost:4000
echo   (Keep this window open. Close it to stop the gallery.)
echo.

timeout /t 1 /nobreak >nul
start "" "http://localhost:4000"
node server\server.js
