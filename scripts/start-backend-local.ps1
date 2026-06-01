$ErrorActionPreference = 'Stop'

$RepoRoot = 'C:\dev\personal-newspaper'
$SupabaseWorkdir = 'infra\supabase'

Set-Location $RepoRoot

Write-Host 'Reading local Supabase environment...'
$supabaseEnv = npx supabase status -o env --workdir $SupabaseWorkdir

if (-not $supabaseEnv) {
  throw 'No Supabase env output received. Start Supabase with: npx supabase start --workdir infra\supabase'
}

foreach ($line in $supabaseEnv) {
  if ($line -match '^\s*([A-Z0-9_]+)=(.*)\s*$') {
    $name = $matches[1]
    $value = $matches[2].Trim('"')

    switch ($name) {
      'SUPABASE_URL' { $env:SUPABASE_URL = $value }
      'SUPABASE_ANON_KEY' { $env:SUPABASE_ANON_KEY = $value }
      'SUPABASE_SERVICE_ROLE_KEY' { $env:SUPABASE_SERVICE_ROLE_KEY = $value }
      'SUPABASE_JWT_SECRET' { $env:SUPABASE_JWT_SECRET = $value }
    }
  }
}

$required = @(
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET'
)

foreach ($name in $required) {
  if (-not [Environment]::GetEnvironmentVariable($name, 'Process')) {
    throw "$name was not found in Supabase env output."
  }
}

if (-not $env:PORT) {
  $env:PORT = '3000'
}

Write-Host 'Starting Public Signal backend on http://localhost:3000 ...'
npm --workspace @personal-newspaper/api run start:dev

