@echo off
setlocal
echo [dsh-web] Dang khoi chay Scheduled Task dsh-web...
schtasks /run /tn "dsh-web"
echo [dsh-web] Da gui lenh khoi chay! Web se tu dong bat len trinh duyet.
