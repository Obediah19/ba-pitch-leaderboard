@echo off
title Arena Quiz Platform
color 0b
echo ========================================================
echo        ⚡ ARENA QUIZ PLATFORM — ONE-CLICK LAUNCHER
echo ========================================================
echo.

echo Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js (v18+) from: https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
if not exist node_modules (
    echo Installing root dependencies...
    call npm install
)
if not exist server\node_modules (
    echo Installing server dependencies...
    call npm install --prefix server
)
if not exist client\node_modules (
    echo Installing client dependencies...
    call npm install --prefix client
)

echo.
echo ========================================================
echo [2/3] Launching Backend Server and Frontend Client...
echo.
echo  - Contender Portal: http://localhost:5173
echo  - Host Portal:      http://localhost:5173/host/login
echo  - Default Login:    admin@arena.edu / admin123
echo ========================================================
echo.

call npm run dev
pause
