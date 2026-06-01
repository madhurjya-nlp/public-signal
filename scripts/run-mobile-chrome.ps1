$ErrorActionPreference = 'Stop'

$RepoRoot = 'C:\dev\personal-newspaper'
$MobileRoot = Join-Path $RepoRoot 'apps\mobile'
$Flutter = 'C:\dev\flutter\bin\flutter.bat'

if (-not (Test-Path $Flutter)) {
  throw "Flutter was not found at $Flutter"
}

Set-Location $MobileRoot

Write-Host 'Starting Public Signal Flutter app in Chrome...'
& $Flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000

