@echo off
echo Starting ProjectHive...
echo =======================

echo [1] Starting Backend API Server (Port 5000)
start cmd /k "cd server && npm run dev"

echo [2] Starting Frontend Server (Port 3000)
start cmd /k "npm run start"

echo =======================
echo ProjectHive is now starting!
echo Frontend will be available at: http://localhost:3000
echo Backend API will be available at: http://localhost:5000
echo Both are running in separate command windows.
