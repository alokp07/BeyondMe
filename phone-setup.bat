@echo off
REM beyondme — phone setup. Double-click this; nothing to type.
setlocal
where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo   Node.js not found. SillyTavern needs it, so if SillyTavern runs
    echo   here it is installed but not on your PATH.
    echo.
    pause
    exit /b 1
)
node "%~dp0phone-setup.js"
pause
