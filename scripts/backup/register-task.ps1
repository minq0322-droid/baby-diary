$ErrorActionPreference = 'Stop'
$scriptPath = (Resolve-Path (Join-Path $PSScriptRoot 'onedrive-backup.ps1')).Path
$powershell = Join-Path $PSHOME 'powershell.exe'
$action = New-ScheduledTaskAction -Execute $powershell -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""
$logonTrigger = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$logonTrigger.Delay = 'PT5M'
$dailyTrigger = New-ScheduledTaskTrigger -Daily -At '12:00PM'
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -Hidden
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName 'BabyLog OneDrive Backup' -Action $action -Trigger @($logonTrigger, $dailyTrigger) -Settings $settings -Principal $principal -Force | Out-Null
Write-Output 'BabyLog OneDrive Backup 작업을 등록했습니다.'
