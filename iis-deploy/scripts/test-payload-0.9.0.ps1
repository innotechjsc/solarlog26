# Test script for payload schema 0.9.0 (PowerShell)
# Usage: .\test-payload-0.9.0.ps1 [-ApiKey "your-key"] [-BaseUrl "http://localhost:5023"]

param(
    [string]$ApiKey = "your-api-key-here",
    [string]$BaseUrl = "http://localhost:5023"
)

$ErrorActionPreference = "Stop"

# Configuration
$PayloadFile = Join-Path (Split-Path $PSScriptRoot -Parent) "payload\payload\basic_payload.json"

# Check if payload file exists
if (-not (Test-Path $PayloadFile)) {
    Write-Host "Error: Payload file not found: $PayloadFile" -ForegroundColor Red
    Write-Host "Please run this script from backend-system\scripts directory"
    exit 1
}

# Read payload
Write-Host "Reading payload from: $PayloadFile" -ForegroundColor Cyan
$payload = Get-Content -Path $PayloadFile -Raw | ConvertFrom-Json

# Update timestamp to current time
$payload.timestamp = [math]::Floor([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
$payloadJson = $payload | ConvertTo-Json -Depth 20

# Headers
$headers = @{
    "X-API-Key" = $ApiKey
    "Content-Type" = "application/json"
}

$url = "$BaseUrl/api/v1/data"

Write-Host ""
Write-Host "Sending payload to: $url" -ForegroundColor Cyan
Write-Host "API Key: $ApiKey" -ForegroundColor Yellow
Write-Host "Timestamp: $($payload.timestamp)" -ForegroundColor Yellow
Write-Host ""

# Send request
try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $payloadJson
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json | Write-Host
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
    exit 1
}

