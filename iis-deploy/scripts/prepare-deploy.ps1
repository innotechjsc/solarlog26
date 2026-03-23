# Script để chuẩn bị các file cần thiết để deploy lên IIS Server
# Chạy script này từ thư mục backend-system
# Usage: .\scripts\prepare-deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Chuẩn bị file để deploy lên IIS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Xác định đường dẫn
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath ".."
$deployPath = Join-Path $backendPath "iis-deploy"

# Xóa folder deploy cũ nếu tồn tại
if (Test-Path $deployPath) {
    Write-Host "Đang xóa folder deploy cũ..." -ForegroundColor Yellow
    Remove-Item $deployPath -Recurse -Force
}

# Tạo folder deploy mới
Write-Host "Tạo folder deploy: $deployPath" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $deployPath -Force | Out-Null

# Danh sách các file/folder cần copy
$filesToCopy = @(
    "server.js",
    "package.json",
    "package-lock.json",
    "web.config",
    "iisnode.yml",
    "swagger.yaml"
)

$foldersToCopy = @(
    "routes",
    "models",
    "services",
    "middleware",
    "dashboard",
    "admin",
    "reports"
)

# Copy các file
Write-Host ""
Write-Host "Đang copy các file..." -ForegroundColor Yellow
foreach ($file in $filesToCopy) {
    $sourcePath = Join-Path $backendPath $file
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath -Destination $deployPath -Force
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] $file (không tìm thấy)" -ForegroundColor Red
    }
}

# Copy các folder
Write-Host ""
Write-Host "Đang copy các folder..." -ForegroundColor Yellow
foreach ($folder in $foldersToCopy) {
    $sourcePath = Join-Path $backendPath $folder
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $deployPath $folder
        Copy-Item $sourcePath -Destination $destPath -Recurse -Force
        Write-Host "  [OK] $folder/" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] $folder/ (không tìm thấy)" -ForegroundColor Red
    }
}

# Copy env.example thành .env.example
Write-Host ""
Write-Host "Đang copy env.example..." -ForegroundColor Yellow
$envExampleSource = Join-Path $backendPath "env.example"
$envExampleDest = Join-Path $deployPath ".env.example"
if (Test-Path $envExampleSource) {
    Copy-Item $envExampleSource -Destination $envExampleDest -Force
    Write-Host "  [OK] .env.example" -ForegroundColor Green
}

# Copy docker-compose.yml (để chạy MongoDB trên server)
Write-Host ""
Write-Host "Đang copy docker-compose.yml..." -ForegroundColor Yellow
$dockerComposeSource = Join-Path $backendPath "docker-compose.yml"
if (Test-Path $dockerComposeSource) {
    Copy-Item $dockerComposeSource -Destination $deployPath -Force
    Write-Host "  [OK] docker-compose.yml" -ForegroundColor Green
}

# Copy mongodb-init folder (nếu cần)
Write-Host ""
Write-Host "Đang copy mongodb-init..." -ForegroundColor Yellow
$mongodbInitSource = Join-Path $backendPath "mongodb-init"
if (Test-Path $mongodbInitSource) {
    $mongodbInitDest = Join-Path $deployPath "mongodb-init"
    Copy-Item $mongodbInitSource -Destination $mongodbInitDest -Recurse -Force
    Write-Host "  [OK] mongodb-init/" -ForegroundColor Green
}

# Copy script init-database (để khởi tạo DB trên server)
Write-Host ""
Write-Host "Đang copy scripts khởi tạo database..." -ForegroundColor Yellow
$scriptsDest = Join-Path $deployPath "scripts"
New-Item -ItemType Directory -Path $scriptsDest -Force | Out-Null

$scriptsToCopy = @(
    "init-database.ps1", 
    "init-database.bat", 
    "init-database-wrapper.bat", 
    "start-mongodb.ps1", 
    "start-mongodb.bat", 
    "start-mongodb-wrapper.bat",
    "insert-test-data.js",
    "insert-test-data.bat",
    "insert-test-data.ps1",
    "aggregate-existing-data.js",
    "aggregate-existing-data.bat",
    "aggregate-existing-data.ps1",
    "create-admin-user.js",
    "create-admin-user.bat"
)
foreach ($script in $scriptsToCopy) {
    $sourcePath = Join-Path $backendPath "scripts\$script"
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath -Destination $scriptsDest -Force
        Write-Host "  [OK] scripts\$script" -ForegroundColor Green
    }
}

# Copy file README template
Write-Host ""
Write-Host "Đang copy file README..." -ForegroundColor Yellow
$readmeTemplateSource = Join-Path $backendPath "DEPLOY-README-TEMPLATE.md"
$readmePath = Join-Path $deployPath "README.md"
if (Test-Path $readmeTemplateSource) {
    Copy-Item $readmeTemplateSource -Destination $readmePath -Force
    Write-Host "  [OK] README.md" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] DEPLOY-README-TEMPLATE.md not found, skipping README" -ForegroundColor Yellow
}

# Tạo file .gitignore trong folder deploy (nếu cần)
$gitignoreContent = @"
node_modules/
.env
*.log
iisnode/
.DS_Store
"@

$gitignorePath = Join-Path $deployPath ".gitignore"
$gitignoreContent | Out-File -FilePath $gitignorePath -Encoding UTF8
Write-Host "  [OK] .gitignore" -ForegroundColor Green

# Tóm tắt
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Hoàn tất!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Folder deploy đã được tạo tại:" -ForegroundColor Yellow
Write-Host "  $deployPath" -ForegroundColor White
Write-Host ""
Write-Host "Các bước tiếp theo:" -ForegroundColor Yellow
Write-Host "  1. Kiểm tra nội dung trong folder iis-deploy" -ForegroundColor Gray
Write-Host "  2. Nén folder này thành file ZIP (nếu cần)" -ForegroundColor Gray
Write-Host "  3. Copy toàn bộ nội dung lên server IIS" -ForegroundColor Gray
Write-Host "  4. Làm theo hướng dẫn trong README.md" -ForegroundColor Gray
Write-Host ""

# Tính kích thước folder
$size = (Get-ChildItem $deployPath -Recurse | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($size / 1MB, 2)
Write-Host "Kích thước: $sizeMB MB" -ForegroundColor Cyan
Write-Host ""

