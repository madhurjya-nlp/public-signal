$ErrorActionPreference = 'Stop'

$RepoRoot = 'C:\dev\personal-newspaper'
$Flutter = 'C:\dev\flutter\bin\flutter.bat'

Set-Location $RepoRoot

Write-Host 'Running TypeScript typecheck...'
npm run typecheck

Write-Host 'Running API tests...'
npm --workspace @personal-newspaper/api test

Write-Host 'Running lint...'
npm run lint

Write-Host 'Running build...'
npm run build

if (Test-Path $Flutter) {
  Write-Host 'Running Flutter analyze...'
  Push-Location (Join-Path $RepoRoot 'apps\mobile')
  try {
    & $Flutter analyze
  }
  finally {
    Pop-Location
  }
}
else {
  Write-Host "Skipping Flutter analyze because $Flutter was not found."
}

Write-Host 'MVP checks completed.'

