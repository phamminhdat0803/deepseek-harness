@echo off
rem ===========================================================================
rem  Dung DSH Web GUI (scheduled task "dsh-web") - dung THAT, va kiem chung.
rem
rem  Vi sao can ban nay: server la CHAU cua task (wscript -> cmd -> node).
rem  Nut "End" trong Task Scheduler chi giet wscript.exe, node.exe van song,
rem  van giu port 3080, va snapshot task van ghi "Running" (Last Result 267009).
rem  dsh-web-stop.ps1 giet dung tien trinh dang giu port, roi cac wrapper o tren,
rem  va chi bao thanh cong khi port da duoc nha.
rem
rem  Dung: stop-task.bat            dung that
rem         stop-task.bat -WhatIf    chi in ra, khong thay doi gi
rem ===========================================================================
setlocal
set "HERE=%~dp0"

rem -WhatIfOnly must change NOTHING, so it skips even the task end below.
set "DRYRUN="
echo %* | findstr /C:"-WhatIfOnly" >nul 2>&1 && set "DRYRUN=1"

if defined DRYRUN (
  echo [dsh-web] Che do -WhatIfOnly: khong dung task, khong dung tien trinh nao.
) else (
  echo [dsh-web] Dang dung Scheduled Task dsh-web...
  schtasks /end /tn "dsh-web" >nul 2>&1
)

echo [dsh-web] Dang kiem tra tien trinh dang giu port 3080...
powershell -NoProfile -ExecutionPolicy Bypass -File "%HERE%dsh-web-stop.ps1" %*
if errorlevel 1 (
  echo [dsh-web] LOI: chua dung duoc. Chay lai voi:  powershell -File "%HERE%dsh-web-stop.ps1" -WhatIfOnly
  exit /b 1
)

exit /b 0
