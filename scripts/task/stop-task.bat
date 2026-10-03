@echo off
setlocal
echo [dsh-web] Dang dung Scheduled Task dsh-web...
schtasks /end /tn "dsh-web" >nul 2>&1

echo [dsh-web] Dang giai phong port 3080 neu co process dang chiem giu...
powershell -NoProfile -Command "$conns = Get-NetTCPConnection -LocalPort 3080 -ErrorAction SilentlyContinue; if ($conns) { $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($p in $pids) { if ($p -gt 0) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue } } }"

echo [dsh-web] Da dung thanh cong!
