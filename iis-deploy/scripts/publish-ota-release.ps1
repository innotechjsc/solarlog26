# Publish OTA release to MQTT (push to devices)
# Usage: .\publish-ota-release.ps1 -Version "v1.0.0" [-ApiBase "http://localhost:5023" -Token "JWT_TOKEN"]
# If Token omitted, script will prompt or use env ADMIN_TOKEN.

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    [string]$ApiBase = $env:API_BASE ?? "http://localhost:5023",
    [string]$Token = $env:ADMIN_TOKEN
)

$api = "$ApiBase/api/v1/ota/releases/$Version/publish"
if (-not $Token) {
    $Token = Read-Host "Enter JWT token (Bearer)"
}
$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type"  = "application/json"
}
try {
    $r = Invoke-RestMethod -Uri $api -Method Post -Headers $headers
    if ($r.status -eq "success") {
        Write-Host "OK: $($r.message)" -ForegroundColor Green
        Write-Host "MQTT topic: $($r.mqtt_topic)"
    } else {
        Write-Host "Error: $($r.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Request failed: $_" -ForegroundColor Red
    exit 1
}
