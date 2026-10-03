#Requires -RunAsAdministrator
[CmdletBinding()]
param(
    [string]$TargetUser = "Welcome"
)

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[dsh-web] Yeu cau quyen Administrator de tao Scheduled Task. Dang mo UAC..." -ForegroundColor Yellow
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -TargetUser `"$TargetUser`""
    exit
}

$taskName = "dsh-web"
$repoRoot = "D:\Workspace\NodeJS\deepseek-harness"
$vbsPath = Join-Path $repoRoot "scripts\task\run-dsh-web.vbs"

if (-not (Test-Path $vbsPath)) {
    Write-Error "Khong tim thay: $vbsPath"
    exit 1
}

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "[dsh-web] Phat hien task cu. Dang go bo..." -ForegroundColor Yellow
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Start-Sleep -Seconds 1
}

Write-Host "[dsh-web] Dang tao Scheduled Task '$taskName' cho user '$TargetUser'..." -ForegroundColor Cyan

$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$vbsPath`"" -WorkingDirectory $repoRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $TargetUser
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Days 0) -MultipleInstances IgnoreNew -Priority 4
$principal = New-ScheduledTaskPrincipal -UserId $TargetUser -LogonType Interactive

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "DeepSeek Harness Web GUI (starts at logon on port 3080)" | Out-Null

Write-Host "[dsh-web] Da dang ky thanh cong Scheduled Task '$taskName'!" -ForegroundColor Green

$task = Get-ScheduledTask -TaskName $taskName
Write-Host "[dsh-web] Trang thai: $($task.State)" -ForegroundColor Green
