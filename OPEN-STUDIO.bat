@echo off
REM SIMPLEST POSSIBLE LAUNCH — opens the studio in your browser
REM No server, no install required — just opens the HTML file directly.

cd /d "%~dp0"

echo Opening Kibookal Studio...
start "" "frontend\index.html"
exit
