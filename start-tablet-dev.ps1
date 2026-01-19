# FastAccounting - Tablet Client Development Startup Script
# Script to start API server and Tablet client for testing

param(
    [switch]$NoBrowser,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
FastAccounting Tablet Client - Development Startup Script

Usage:
    .\start-tablet-dev.ps1              # Start and open browser
    .\start-tablet-dev.ps1 -NoBrowser    # Start without opening browser
    .\start-tablet-dev.ps1 -Help         # Show this help message

This script will:
    1. Check if Node.js is installed
    2. Kill any process on port 5173 (if in use)
    3. Start API server (port 3000)
    4. Start Tablet client (port 5173)
    5. Open browser for testing (unless -NoBrowser is used)

To stop: Press Ctrl+C in terminal windows or close the windows
"@
    exit 0
}

# Màu sắc cho output
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

# Function để viết thông báo
function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor $InfoColor
}

function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor $SuccessColor
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host $Message -ForegroundColor $ErrorColor
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host $Message -ForegroundColor $WarningColor
}

# Check Node.js
Write-Info "[*] Checking Node.js..."
try {
    $nodeVersion = node --version
    Write-Success "[OK] Node.js installed: $nodeVersion"
} catch {
    Write-Error-Custom "[ERROR] Node.js is not installed. Please install Node.js first."
    exit 1
}

# Check npm
Write-Info "[*] Checking npm..."
try {
    $npmVersion = npm --version
    Write-Success "[OK] npm installed: $npmVersion"
} catch {
    Write-Error-Custom "[ERROR] npm is not installed."
    exit 1
}

# Get project root path
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ApiPath = Join-Path $ProjectRoot "api"
$ClientPath = Join-Path $ProjectRoot "client-tablet"

# Check if directories exist
if (-not (Test-Path $ApiPath)) {
    Write-Error-Custom "[ERROR] API directory not found: $ApiPath"
    exit 1
}

if (-not (Test-Path $ClientPath)) {
    Write-Error-Custom "[ERROR] client-tablet directory not found: $ClientPath"
    exit 1
}

# Check node_modules in API
$ApiNodeModules = Join-Path $ApiPath "node_modules"
if (-not (Test-Path $ApiNodeModules)) {
    Write-Warning-Custom "[WARN] node_modules in API not installed. Installing..."
    Set-Location $ApiPath
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "[ERROR] Error installing dependencies for API"
        exit 1
    }
    Write-Success "[OK] Dependencies installed for API"
}

# Check node_modules in client-tablet
$ClientNodeModules = Join-Path $ClientPath "node_modules"
if (-not (Test-Path $ClientNodeModules)) {
    Write-Warning-Custom "[WARN] node_modules in client-tablet not installed. Installing..."
    Set-Location $ClientPath
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "[ERROR] Error installing dependencies for client-tablet"
        exit 1
    }
    Write-Success "[OK] Dependencies installed for client-tablet"
}

# Check .env file in API
$ApiEnvFile = Join-Path $ApiPath ".env"
if (-not (Test-Path $ApiEnvFile)) {
    Write-Warning-Custom "[WARN] .env file not found in API. Please create .env file with required environment variables."
}

# Kill any process using port 5173
$ClientPort = 5173
Write-Info "[*] Checking port $ClientPort..."
try {
    $conn = Get-NetTCPConnection -LocalPort $ClientPort -ErrorAction SilentlyContinue
    if ($conn) {
        $pids = $conn.OwningProcess | Sort-Object -Unique
        foreach ($pid in $pids) {
            Write-Warning-Custom "[WARN] Killing process on port $ClientPort (PID: $pid)..."
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 1
        Write-Success "[OK] Port $ClientPort freed."
    } else {
        Write-Success "[OK] Port $ClientPort is free."
    }
} catch {
    Write-Warning-Custom "[WARN] Could not check/kill port $ClientPort (run as Admin if needed)."
}

Write-Info ""
Write-Info "[*] Starting services..."
Write-Info ""

# Start API server in new terminal
Write-Info "[*] Starting API server (port 3000)..."
$ApiScript = "`$Host.UI.RawUI.WindowTitle = 'FastAccounting - API Server (Port 3000)'; Write-Host 'FastAccounting API Server' -ForegroundColor Cyan; Write-Host 'http://localhost:3000' -ForegroundColor Green; Write-Host ''; Set-Location '$ApiPath'; npm run dev"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $ApiScript

# Wait a bit for API to start
Start-Sleep -Seconds 3

# Start Client in new terminal
Write-Info "[*] Starting Tablet Client (port 5173)..."
$ClientScript = "`$Host.UI.RawUI.WindowTitle = 'FastAccounting - Tablet Client (Port 5173)'; Write-Host 'FastAccounting Tablet Client' -ForegroundColor Cyan; Write-Host 'http://localhost:5173' -ForegroundColor Green; Write-Host ''; Set-Location '$ClientPath'; npm run dev"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $ClientScript

# Wait a bit for client to start
Start-Sleep -Seconds 5

Write-Info ""
Write-Success "[OK] Started successfully!"
Write-Info ""
Write-Info "[*] API Server:    http://localhost:3000"
Write-Info "[*] Tablet Client: http://localhost:5173"
Write-Info ""

# Open browser if -NoBrowser flag is not set
if (-not $NoBrowser) {
    Write-Info "[*] Opening browser..."
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:5173"
    Write-Success "[OK] Browser opened at http://localhost:5173"
}

Write-Info ""
Write-Warning-Custom "[NOTE] Notes:"
Write-Info "   - To stop services, close terminal windows or press Ctrl+C"
Write-Info "   - API server runs on port 3000"
Write-Info "   - Tablet client runs on port 5173"
Write-Info "   - Make sure MongoDB is running if API needs database connection"
Write-Info ""
Write-Success "[OK] Ready to test! Happy coding!"
Write-Info ""
