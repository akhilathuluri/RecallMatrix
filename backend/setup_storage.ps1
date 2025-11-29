# Setup script for file storage feature
Write-Host "Setting up file storage for Telegram bot..." -ForegroundColor Green

# Install dependencies
Write-Host "`nInstalling Python dependencies..." -ForegroundColor Yellow
pip install supabase storage3

# Create storage bucket
Write-Host "`nCreating Supabase storage bucket..." -ForegroundColor Yellow
python create_storage_bucket.py

Write-Host "`n✓ Setup complete!" -ForegroundColor Green
Write-Host "Restart the backend to apply changes." -ForegroundColor Cyan
