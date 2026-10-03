@echo off
setlocal
cd /d "%~dp0"
echo ========================================================
echo  Installing DeepSeek Harness Web Scheduled Task (dsh-web)
echo ========================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-task.ps1"
echo.
pause
