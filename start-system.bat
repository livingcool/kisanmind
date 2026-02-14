@echo off
REM ############################################################################
REM KisanMind System Startup Script (Windows)
REM
REM This script starts all KisanMind services in the correct order:
REM 1. ML Inference Service (Port 8100)
REM 2. API Server (Port 3001)
REM 3. Frontend (Port 3000)
REM
REM Usage: start-system.bat
REM ############################################################################

setlocal enabledelayedexpansion

cls
echo ======================================
echo     KisanMind System Startup
echo ======================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the KisanMind root directory
    pause
    exit /b 1
)

REM Check for required commands
echo [INFO] Checking prerequisites...

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VERSION=%%v
echo [OK] Node.js found: !NODE_VERSION!

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm --version') do set NPM_VERSION=%%v
echo [OK] npm found: !NPM_VERSION!

where py >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('py --version') do set PYTHON_VERSION=%%v
echo [OK] Python found: !PYTHON_VERSION!

echo.

REM ############################################################################
REM Start ML Inference Service
REM ############################################################################

echo [INFO] Starting ML Inference Service...

cd services\ml-inference

REM Check if dependencies are installed
py -c "import fastapi" 2>nul
if errorlevel 1 (
    echo [WARN] Installing ML service dependencies...
    py -m pip install -r requirements.txt
    py -m pip install protobuf==5.29.3
)

REM Start ML service in new window
start "KisanMind ML Service" cmd /k "py -m uvicorn app:app --port 8100"

echo [INFO] Waiting for ML Service to start...
timeout /t 5 /nobreak >nul

cd ..\..

REM Check if ML service is responding
curl -s http://localhost:8100/health >nul 2>&1
if errorlevel 1 (
    echo [ERROR] ML Service failed to start
    echo [ERROR] Check the ML Service window for errors
    pause
    exit /b 1
)
echo [OK] ML Service started successfully

echo.

REM ############################################################################
REM Start API Server
REM ############################################################################

echo [INFO] Starting API Server...

cd api-server

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [WARN] Installing API server dependencies...
    call npm install
)

REM Start API server in new window
start "KisanMind API Server" cmd /k "npm run dev"

echo [INFO] Waiting for API Server to start...
timeout /t 8 /nobreak >nul

cd ..

REM Check if API server is responding
curl -s http://localhost:3001/health >nul 2>&1
if errorlevel 1 (
    echo [ERROR] API Server failed to start
    echo [ERROR] Check the API Server window for errors
    pause
    exit /b 1
)
echo [OK] API Server started successfully

echo.

REM ############################################################################
REM Start Frontend
REM ############################################################################

echo [INFO] Starting Frontend...

cd frontend

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [WARN] Installing frontend dependencies...
    call npm install
)

REM Start frontend in new window
start "KisanMind Frontend" cmd /k "npm run dev"

echo [INFO] Waiting for Frontend to start...
timeout /t 10 /nobreak >nul

cd ..

REM Check if frontend is responding
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo [WARN] Frontend may still be starting...
    echo [INFO] Check the Frontend window
) else (
    echo [OK] Frontend started successfully
)

echo.

REM ############################################################################
REM Final Status
REM ############################################################################

echo ======================================
echo   KisanMind System is Running!
echo ======================================
echo.
echo Services:
echo   * ML Service:  http://localhost:8100
echo   * API Server:  http://localhost:3001
echo   * Frontend:    http://localhost:3000
echo.
echo To access the application:
echo   Opening browser to: http://localhost:3000
echo.
echo Service windows have been opened.
echo Close those windows to stop the services.
echo.
echo ======================================

REM Open browser
timeout /t 2 /nobreak >nul
start http://localhost:3000

pause
