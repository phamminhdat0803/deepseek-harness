#Requires -RunAsAdministrator
[CmdletBinding()]
param()

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[dsh-web] Yeu cau quyen Administrator de xoa Scheduled Task. Dang mo UAC..." -ForegroundColor Yellow
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

$taskName = "dsh-web"
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if (-not $existing) {
    Write-Host "[dsh-web] Task '$taskName' khong ton tai." -ForegroundColor Yellow
    exit 0
}

Write-Host "[dsh-web] Dang dung va go bo Scheduled Task '$taskName'..." -ForegroundColor Cyan
Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
Write-Host "[dsh-web] Da go bo Scheduled Task thanh cong!" -ForegroundColor Green
