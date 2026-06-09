$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$apiDir = Join-Path $repoRoot "apps\api"
$webDir = Join-Path $repoRoot "apps\web"

$env:UV_CACHE_DIR = Join-Path $repoRoot ".uv-cache"
$env:npm_config_cache = Join-Path $repoRoot ".npm-cache"

New-Item -ItemType Directory -Force -Path $env:UV_CACHE_DIR, $env:npm_config_cache | Out-Null

$tempCandidates = @(
    (Join-Path (Split-Path -Parent $repoRoot) ".codex_pytest_tmp"),
    (Join-Path $repoRoot ".tmp"),
    ([System.IO.Path]::GetTempPath())
)

foreach ($candidate in $tempCandidates) {
    try {
        New-Item -ItemType Directory -Force -Path $candidate | Out-Null
        $probeDir = Join-Path $candidate ("write-probe-" + [guid]::NewGuid().ToString("N"))
        New-Item -ItemType Directory -Force -Path $probeDir | Out-Null
        $probe = Join-Path $probeDir "write-probe.tmp"
        Set-Content -LiteralPath $probe -Value "ok" -Encoding ASCII
        Remove-Item -LiteralPath $probeDir -Recurse -Force
        $env:TEMP = $candidate
        $env:TMP = $candidate
        break
    }
    catch {
        continue
    }
}

if (-not $env:TEMP) {
    throw "No writable temporary directory was found."
}

Write-Host "Running backend tests..."
Push-Location $apiDir
try {
    $venvPython = Join-Path $apiDir ".venv\Scripts\python.exe"
    if (Test-Path $venvPython) {
        & $venvPython -m pytest -p no:cacheprovider
    }
    else {
        uv run pytest -p no:cacheprovider
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Backend tests failed with exit code $LASTEXITCODE."
    }
}
finally {
    Pop-Location
}

Write-Host "Running frontend build..."
Push-Location $webDir
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed with exit code $LASTEXITCODE."
    }
}
finally {
    Pop-Location
}
