# PowerShell script để tự động hóa một số bước deploy lên IIS
# Chạy script này với quyền Administrator
# Usage: .\scripts\deploy-iis.ps1 -SiteName "SolarLogger-API" -Port 3000 -PhysicalPath "D:\Solar\backend-system"

param(
    [string]$SiteName = "SolarLogger-API",
    [string]$AppPoolName = "SolarLoggerAppPool",
    [int]$Port = 3000,
    [string]$PhysicalPath = "D:\Solar\backend-system"
)

# Kiểm tra quyền Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Lỗi: Script này cần chạy với quyền Administrator!" -ForegroundColor Red
    Write-Host "Vui lòng mở PowerShell với quyền Administrator và chạy lại." -ForegroundColor Yellow
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Script Deploy IIS cho SolarLogger API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra WebAdministration module
Write-Host "[1/8] Kiểm tra WebAdministration module..." -ForegroundColor Yellow
try {
    Import-Module WebAdministration -ErrorAction Stop
    Write-Host "✓ WebAdministration module đã sẵn sàng" -ForegroundColor Green
} catch {
    Write-Host "✗ Lỗi: Không thể import WebAdministration module" -ForegroundColor Red
    Write-Host "  Vui lòng đảm bảo IIS Management Tools đã được cài đặt" -ForegroundColor Yellow
    exit 1
}

# Kiểm tra iisnode
Write-Host "[2/8] Kiểm tra iisnode module..." -ForegroundColor Yellow
$iisnodeModule = Get-WebGlobalModule | Where-Object { $_.Name -eq "iisnode" }
if ($iisnodeModule) {
    Write-Host "✓ iisnode module đã được cài đặt" -ForegroundColor Green
} else {
    Write-Host "✗ Cảnh báo: iisnode module chưa được cài đặt" -ForegroundColor Red
    Write-Host "  Vui lòng cài đặt iisnode từ: https://github.com/Azure/iisnode/releases" -ForegroundColor Yellow
    Write-Host "  Sau đó khởi động lại IIS và chạy lại script này" -ForegroundColor Yellow
    $continue = Read-Host "Bạn có muốn tiếp tục không? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Kiểm tra Node.js
Write-Host "[3/8] Kiểm tra Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js đã được cài đặt: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Lỗi: Node.js chưa được cài đặt" -ForegroundColor Red
    Write-Host "  Vui lòng cài đặt Node.js từ: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Kiểm tra thư mục
Write-Host "[4/8] Kiểm tra thư mục ứng dụng..." -ForegroundColor Yellow
if (Test-Path $PhysicalPath) {
    Write-Host "✓ Thư mục tồn tại: $PhysicalPath" -ForegroundColor Green
} else {
    Write-Host "✗ Lỗi: Thư mục không tồn tại: $PhysicalPath" -ForegroundColor Red
    exit 1
}

# Kiểm tra file server.js
if (Test-Path (Join-Path $PhysicalPath "server.js")) {
    Write-Host "✓ File server.js tồn tại" -ForegroundColor Green
} else {
    Write-Host "✗ Lỗi: File server.js không tồn tại trong thư mục" -ForegroundColor Red
    exit 1
}

# Kiểm tra node_modules
Write-Host "[5/8] Kiểm tra dependencies..." -ForegroundColor Yellow
if (Test-Path (Join-Path $PhysicalPath "node_modules")) {
    Write-Host "✓ node_modules đã tồn tại" -ForegroundColor Green
} else {
    Write-Host "⚠ node_modules chưa tồn tại, đang cài đặt..." -ForegroundColor Yellow
    Set-Location $PhysicalPath
    npm install --production
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dependencies đã được cài đặt" -ForegroundColor Green
    } else {
        Write-Host "✗ Lỗi khi cài đặt dependencies" -ForegroundColor Red
        exit 1
    }
}

# Tạo Application Pool
Write-Host "[6/8] Tạo Application Pool..." -ForegroundColor Yellow
$existingAppPool = Get-WebAppPoolState -Name $AppPoolName -ErrorAction SilentlyContinue
if ($existingAppPool) {
    Write-Host "⚠ Application Pool '$AppPoolName' đã tồn tại" -ForegroundColor Yellow
    $recreate = Read-Host "Bạn có muốn xóa và tạo lại không? (y/n)"
    if ($recreate -eq "y" -or $recreate -eq "Y") {
        Remove-WebAppPool -Name $AppPoolName
        Write-Host "  Đã xóa Application Pool cũ" -ForegroundColor Gray
    } else {
        Write-Host "  Giữ nguyên Application Pool hiện tại" -ForegroundColor Gray
    }
}

if (-not (Get-WebAppPoolState -Name $AppPoolName -ErrorAction SilentlyContinue)) {
    New-WebAppPool -Name $AppPoolName
    Set-ItemProperty IIS:\AppPools\$AppPoolName -Name managedRuntimeVersion -Value ""
    Set-ItemProperty IIS:\AppPools\$AppPoolName -Name startMode -Value "AlwaysRunning"
    Set-ItemProperty IIS:\AppPools\$AppPoolName -Name processModel.idleTimeout -Value ([TimeSpan]::FromMinutes(0))
    Write-Host "✓ Application Pool '$AppPoolName' đã được tạo và cấu hình" -ForegroundColor Green
} else {
    Write-Host "✓ Sử dụng Application Pool hiện có" -ForegroundColor Green
}

# Tạo Website
Write-Host "[7/8] Tạo Website..." -ForegroundColor Yellow
$existingSite = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
if ($existingSite) {
    Write-Host "⚠ Website '$SiteName' đã tồn tại" -ForegroundColor Yellow
    $recreate = Read-Host "Bạn có muốn xóa và tạo lại không? (y/n)"
    if ($recreate -eq "y" -or $recreate -eq "Y") {
        Remove-Website -Name $SiteName
        Write-Host "  Đã xóa Website cũ" -ForegroundColor Gray
    } else {
        Write-Host "  Giữ nguyên Website hiện tại" -ForegroundColor Gray
        Write-Host "✓ Website đã tồn tại" -ForegroundColor Green
    }
}

if (-not (Get-Website -Name $SiteName -ErrorAction SilentlyContinue)) {
    # Kiểm tra port có đang được sử dụng không
    $portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($portInUse) {
        Write-Host "✗ Lỗi: Port $Port đang được sử dụng" -ForegroundColor Red
        Write-Host "  Vui lòng chọn port khác hoặc dừng service đang sử dụng port này" -ForegroundColor Yellow
        exit 1
    }

    New-Website -Name $SiteName `
        -Port $Port `
        -PhysicalPath $PhysicalPath `
        -ApplicationPool $AppPoolName
    
    Write-Host "✓ Website '$SiteName' đã được tạo trên port $Port" -ForegroundColor Green
} else {
    Write-Host "✓ Website đã tồn tại" -ForegroundColor Green
}

# Cấp quyền truy cập
Write-Host "[8/8] Cấp quyền truy cập..." -ForegroundColor Yellow
try {
    $acl = Get-Acl $PhysicalPath
    $permission = "IIS_IUSRS", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow"
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
    $acl.SetAccessRule($accessRule)
    
    $appPoolIdentity = "IIS AppPool\$AppPoolName"
    $permission2 = $appPoolIdentity, "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow"
    $accessRule2 = New-Object System.Security.AccessControl.FileSystemAccessRule $permission2
    $acl.SetAccessRule($accessRule2)
    
    Set-Acl $PhysicalPath $acl
    Write-Host "✓ Đã cấp quyền truy cập cho IIS_IUSRS và $appPoolIdentity" -ForegroundColor Green
} catch {
    Write-Host "⚠ Cảnh báo: Không thể tự động cấp quyền" -ForegroundColor Yellow
    Write-Host "  Vui lòng cấp quyền thủ công:" -ForegroundColor Yellow
    Write-Host "  1. Click chuột phải vào thư mục $PhysicalPath" -ForegroundColor Gray
    Write-Host "  2. Properties → Security → Add" -ForegroundColor Gray
    Write-Host "  3. Thêm IIS_IUSRS và IIS AppPool\$AppPoolName với quyền Read & Execute" -ForegroundColor Gray
}

# Khởi động Application Pool
Write-Host ""
Write-Host "Khởi động Application Pool..." -ForegroundColor Yellow
Start-WebAppPool -Name $AppPoolName
Start-Sleep -Seconds 2

$appPoolState = Get-WebAppPoolState -Name $AppPoolName
if ($appPoolState.Value -eq "Started") {
    Write-Host "✓ Application Pool đã được khởi động" -ForegroundColor Green
} else {
    Write-Host "⚠ Application Pool chưa khởi động, đang thử lại..." -ForegroundColor Yellow
    Start-WebAppPool -Name $AppPoolName
    Start-Sleep -Seconds 3
}

# Tóm tắt
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy hoàn tất!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Thông tin Website:" -ForegroundColor Yellow
Write-Host "  - Tên: $SiteName" -ForegroundColor White
Write-Host "  - Port: $Port" -ForegroundColor White
Write-Host "  - URL: http://localhost:$Port" -ForegroundColor White
Write-Host "  - Application Pool: $AppPoolName" -ForegroundColor White
Write-Host ""
Write-Host "Các bước tiếp theo:" -ForegroundColor Yellow
Write-Host "  1. Đảm bảo MongoDB đang chạy: .\scripts\start-mongodb.ps1" -ForegroundColor Gray
Write-Host "  2. Cấu hình environment variables trong IIS hoặc tạo file .env" -ForegroundColor Gray
Write-Host "  3. Khởi tạo database: .\scripts\init-database.ps1" -ForegroundColor Gray
Write-Host "  4. Test: curl http://localhost:$Port/health" -ForegroundColor Gray
Write-Host ""
Write-Host "Xem logs:" -ForegroundColor Yellow
Write-Host "  Get-Content `"$PhysicalPath\iisnode\iisnode.log`" -Tail 50" -ForegroundColor Gray
Write-Host ""

