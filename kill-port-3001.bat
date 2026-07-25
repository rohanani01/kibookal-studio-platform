@echo off
REM Kill any process holding port 3001 (the backend's default port).
REM Useful when you've closed a CMD window without ending the Node process.

echo Looking for processes on port 3001...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
  echo Killing PID %%i
  taskkill /pid %%i /f
)
echo Done.
pause
