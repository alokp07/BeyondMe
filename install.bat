@echo off
REM beyondme installer for Windows — just double-click this file.
REM
REM Uses Node, which SillyTavern already requires, so there's nothing extra
REM to install.

setlocal

echo.
echo   beyondme installer
echo   ------------------
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo   Node.js was not found.
    echo.
    echo   SillyTavern needs Node to run, so if SillyTavern works on this
    echo   machine, Node is installed but not on your PATH. Otherwise get it
    echo   from https://nodejs.org and run this again.
    echo.
    pause
    exit /b 1
)

if "%~1"=="" (
    REM No path given — let install.js look for SillyTavern next to this folder
    node "%~dp0install.js"
) else (
    node "%~dp0install.js" "%~1"
)

echo.
pause
