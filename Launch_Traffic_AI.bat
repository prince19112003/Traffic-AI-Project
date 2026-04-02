@echo off
title TRAFFICGUARD AI LAUNCHER
color 0b

echo ========================================================
echo   TRAFFICGUARD AI : COMMAND CENTER (DESKTOP LAUNCHER)
echo ========================================================
echo.

echo [DEBUG] Checking environment...
where python >nul 2>&1 || (echo [ERROR] Python not found! && pause && exit)
where npm >nul 2>&1 || (echo [ERROR] NPM not found! && pause && exit)

echo [1/3] Starting Python AI Backend...
start "Traffic AI Backend" cmd /c "cd backend && python main.py"

echo [2/3] Starting Next.js Dashboard Server...
start "Traffic Dashboard Server" cmd /c "cd frontend-next && npm run dev"

echo.
echo Waiting for servers to initialize (12s)...
echo Please wait while the AI engine and UI services start up.
timeout /t 12 /nobreak >nul

echo.
echo [3/3] Launching Desktop Application Window...
cd frontend-next
npm run desktop

echo.
echo Dashboard closed. Cleaning up...
pause
