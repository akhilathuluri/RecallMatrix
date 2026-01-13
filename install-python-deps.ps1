# Quick Fix for Python Import Errors
# This script installs the Python backend dependencies

Write-Host "Installing Python backend dependencies..." -ForegroundColor Cyan

# Navigate to backend directory
$backendPath = Join-Path $PSScriptRoot "backend"
Set-Location -Path $backendPath

# Install dependencies system-wide (or use virtual environment if it exists)
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "Using virtual environment..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
}

# Install all requirements
Write-Host "Installing from requirements.txt..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host ""
Write-Host "✓ All dependencies installed!" -ForegroundColor Green
Write-Host ""
Write-Host "The Python import errors should now be resolved." -ForegroundColor Cyan
