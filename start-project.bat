@echo off
echo.
echo  ================================================
echo   🐝  ProjectHive - Starting All Services...
echo  ================================================
echo.

REM Check if GROQ_API_KEY is set in server/.env
findstr /C:"GROQ_API_KEY=gsk_" server\.env >nul 2>&1
if %errorlevel% neq 0 (
    echo  ⚠️  WARNING: GROQ_API_KEY not configured!
    echo.
    echo  To enable the AI Project Idea Generator:
    echo  1. Go to: https://console.groq.com
    echo  2. Sign up FREE (no credit card)
    echo  3. Click API Keys → Create API Key
    echo  4. Open server\.env and replace:
    echo     GROQ_API_KEY=your_groq_api_key_here
    echo     with your actual key (starts with gsk_...)
    echo.
    pause
)

echo  [1/2] Starting Backend API Server on port 5000...
start cmd /k "cd server && npm run dev"

timeout /t 2 /nobreak > nul

echo  [2/2] Starting Frontend Server on port 3000...
start cmd /k "npm run start"

echo.
echo  ================================================
echo   ✅ ProjectHive is starting!
echo.
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:5000/api
echo   AI Demo  : http://localhost:3000/pages/projects/generator.html
echo  ================================================
echo.
