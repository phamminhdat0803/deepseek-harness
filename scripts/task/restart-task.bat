@echo off
setlocal
call "%~dp0stop-task.bat"
timeout /t 2 /nobreak >nul
call "%~dp0start-task.bat"
