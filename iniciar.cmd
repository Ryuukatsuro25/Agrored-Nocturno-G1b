@echo off
cd /d "%~dp0"
title AgroRed - aplicacion completa
start "" /min cmd /c "timeout /t 4 >nul & start http://localhost:8080"
node iniciar-todo.js
pause
