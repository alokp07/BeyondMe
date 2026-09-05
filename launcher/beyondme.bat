@echo off
title beyondme
rem Leaner than Start.bat: dependencies are already installed, so skip the
rem npm install pass that runs on every launch. Use Start.bat after a git pull.
pushd %~dp0
set NODE_ENV=production
node server.js %*
popd
echo.
echo beyondme has stopped. Press any key to close.
pause >nul
