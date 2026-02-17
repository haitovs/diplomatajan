@echo off
echo ===============================================
echo    Atajan Brute-Force Attack Simulation
echo    Security Operations Center v2
echo ===============================================
echo.

cd /d "%~dp0"

echo Installing dependencies (if needed)...
call npm install

echo.
echo ===============================================
echo Starting development server...
echo.
echo Application will open at:
echo   http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo ===============================================
echo.

start "" "http://localhost:5173"

npm run dev
