@echo off
setlocal
cd /d "%~dp0..\.."

echo ========================================================
echo  Stop task, pull code, rebuild, and restart dsh-web
echo ========================================================

echo [1/4] Stopping dsh-web task and freeing port 3080...
call "%~dp0stop-task.bat"

echo.
echo [2/4] Pulling git...
git pull

echo.
echo [3/4] Rebuilding packages...
call pnpm run build

echo.
echo [4/4] Starting dsh-web task...
call "%~dp0start-task.bat"

echo.
echo ========================================================
echo  Done! dsh-web is running at http://127.0.0.1:3080
echo ========================================================
pause
