#!/usr/bin/env bash
echo "========================================================"
echo "       ⚡ ARENA QUIZ PLATFORM — ONE-CLICK LAUNCHER"
echo "========================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js (v18+) from: https://nodejs.org"
    exit 1
fi

echo "[1/3] Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    npm install --prefix server
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    npm install --prefix client
fi

echo ""
echo "========================================================"
echo "[2/3] Launching Backend Server and Frontend Client..."
echo ""
echo " - Contender Portal: http://localhost:5173"
echo " - Host Portal:      http://localhost:5173/host/login"
echo " - Default Login:    admin@arena.edu / admin123"
echo "========================================================"
echo ""

npm run dev
