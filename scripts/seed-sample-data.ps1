# Script PowerShell để chèn dữ liệu mẫu
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Chạy script chèn dữ liệu mẫu" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath

Set-Location $projectRoot

Write-Host "Đang chạy script Node.js..." -ForegroundColor Yellow
node scripts/seed-sample-data.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Hoàn tất!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Có lỗi xảy ra!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Nhấn phím bất kỳ để thoát..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")





