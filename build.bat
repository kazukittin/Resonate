@echo off
echo ========================================
echo   Resonate - Building Windows EXE
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo [2/3] Rebuilding native modules for Electron...
call npx @electron/rebuild -f -w better-sqlite3
if errorlevel 1 (
    echo ERROR: Rebuild failed
    pause
    exit /b 1
)

echo.
echo [3/3] Building Windows EXE...
call npm run build
if errorlevel 1 (
    echo ERROR: Vite build failed
    pause
    exit /b 1
)

call npx electron-builder --win portable
if errorlevel 1 (
    echo ERROR: Electron builder failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Build Complete!
echo   Output: release\Resonate 1.0.0.exe
echo ========================================
echo.

explorer release
pause
