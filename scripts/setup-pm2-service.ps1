# Script to setup PM2 as Windows Service
# Run as Administrator

Write-Host "Setting up PM2 as Windows Service..." -ForegroundColor Green

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Error: This script requires Administrator privileges!" -ForegroundColor Red
    exit 1
}

# Check if PM2 is installed
try {
    pm2 --version | Out-Null
    Write-Host "PM2 is installed" -ForegroundColor Green
} catch {
    Write-Host "Installing PM2..." -ForegroundColor Yellow
    npm install -g pm2
}

# Install PM2 Windows Service
Write-Host "Installing PM2 Windows Service..." -ForegroundColor Yellow
pm2 install pm2-windows-service

# Setup service
Write-Host "Setting up PM2 service..." -ForegroundColor Yellow
pm2-service-install

Write-Host ""
Write-Host "PM2 Windows Service installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Navigate to your application directory" -ForegroundColor Gray
Write-Host "2. Start your app: pm2 start ecosystem.config.js" -ForegroundColor Gray
Write-Host "3. Save PM2 process list: pm2 save" -ForegroundColor Gray
Write-Host "4. Your app will now start automatically on Windows boot" -ForegroundColor Gray
Write-Host ""

