@echo off
setlocal
cd /d "D:\Workspace\NodeJS\deepseek-harness"

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 3080 -State Listen -ErrorAction SilentlyContinue) { exit 100 }"
if %ERRORLEVEL% EQU 100 (
    echo [%DATE% %TIME%] [dsh-web] Port 3080 da duoc su dung. Bo qua khoi dong trung lap. >> logs\dsh-web.log
    exit /b 0
)

set "NODE_EXTRA_CA_CERTS=C:\Users\Welcome\AppData\Roaming\9router\mitm\rootCA.crt"
"C:\nvm4w\nodejs\node.exe" --import tsx/esm apps/cli/src/bin.ts web > logs\dsh-web.log 2>&1
