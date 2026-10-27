$ErrorActionPreference = 'Stop'
Unregister-ScheduledTask -TaskName 'BabyLog OneDrive Backup' -Confirm:$false -ErrorAction SilentlyContinue
Write-Output 'BabyLog OneDrive Backup 작업을 제거했습니다.'
