# PowerShell Update & Verification Script for linkedin-skills Integration
$ErrorActionPreference = "Stop"

$RepoDir = "services/linkedin-skills"
$PinnedCommit = "baa9c909916f98764828e15e7cfc9dffa1aaadb1"

Write-Host "=== LinkedIn Skills Upgrade & Health Check ===" -ForegroundColor Cyan
Write-Host "Target Directory: $RepoDir"

if (-not (Test-Path $RepoDir)) {
    Write-Error "Error: $RepoDir does not exist."
    exit 1
}

Push-Location $RepoDir
try {
    $CurrentCommit = (git rev-parse HEAD).Trim()
    Write-Host "Current Commit: $CurrentCommit"
    Write-Host "Pinned Commit:  $PinnedCommit"

    if ($CurrentCommit -ne $PinnedCommit) {
        Write-Warning "Current commit does not match pinned commit ($PinnedCommit)."
    }

    Write-Host "Running Frontmatter Check..." -ForegroundColor Yellow
    py scripts/check_frontmatter.py

    Write-Host "Running Markdown References Check..." -ForegroundColor Yellow
    py scripts/check_markdown_references.py

    Write-Host "Running No Secrets Check..." -ForegroundColor Yellow
    py scripts/check_no_secrets.py

    Write-Host "=== All Verification Checks Passed ===" -ForegroundColor Green
}
finally {
    Pop-Location
}
