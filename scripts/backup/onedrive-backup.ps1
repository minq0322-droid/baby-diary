$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$appData = Join-Path $env:LOCALAPPDATA 'BabyLog'
$envFile = Join-Path $appData 'backup.env'
$logFile = Join-Path $appData 'backup.log'

New-Item -ItemType Directory -Path $appData -Force | Out-Null
try {
    if (-not (Test-Path -LiteralPath $envFile)) {
        throw "환경 파일을 찾을 수 없습니다: $envFile"
    }

    Get-Content -LiteralPath $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
            $parts = $line -split '=', 2
            [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), 'Process')
        }
    }

    if (-not $env:OneDrive) {
        throw 'OneDrive 환경 변수를 찾을 수 없습니다.'
    }

    $env:OUT_DIR = Join-Path $env:OneDrive '육아기록 백업'
    Push-Location $repoRoot
    try {
        & npm.cmd run backup -- --once-per-day *>&1 | ForEach-Object {
            "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $_" | Add-Content -LiteralPath $logFile -Encoding utf8
        }
        if ($LASTEXITCODE -ne 0) {
            throw "백업 명령이 종료 코드 $LASTEXITCODE 로 끝났습니다."
        }
    }
    finally {
        Pop-Location
    }
}
catch {
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ERROR: $($_.Exception.Message)" | Add-Content -LiteralPath $logFile -Encoding utf8
    exit 1
}
