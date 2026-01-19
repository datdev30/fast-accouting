$BackendPort = 3000
$FrontendPort = 5173

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

function Stop-Port {
    param([int]$Port)
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($conn) {
            $pids = $conn.OwningProcess | Sort-Object -Unique
            foreach ($processId in $pids) {
                Write-Warning-Custom "Stopping process on port $Port (PID: $processId)..."
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
            Start-Sleep -Seconds 1
            Write-Success "Port $Port freed."
        } else {
            Write-Info "Port $Port is already free."
        }
    } catch {
        Write-Warning-Custom "Could not check/stop port $Port (run as Admin if needed)."
    }
}

Write-Info "Starting FastAccounting..."
Write-Info ""

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
$ProjectRoot = $PSScriptRoot
$ApiPath = Join-Path $ProjectRoot "api"
$ClientPath = Join-Path $ProjectRoot "client"

# Check if directories exist
if (-not (Test-Path $ApiPath)) {
    Write-Error-Custom "[ERROR] API directory not found: $ApiPath"
    exit 1
}

if (-not (Test-Path $ClientPath)) {
    Write-Error-Custom "[ERROR] Client directory not found: $ClientPath"
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
    Set-Location $ProjectRoot
}

# Check node_modules in client
$ClientNodeModules = Join-Path $ClientPath "node_modules"
if (-not (Test-Path $ClientNodeModules)) {
    Write-Warning-Custom "[WARN] node_modules in client not installed. Installing..."
    Set-Location $ClientPath
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "[ERROR] Error installing dependencies for client"
        exit 1
    }
    Write-Success "[OK] Dependencies installed for client"
    Set-Location $ProjectRoot
}

# 1. Stop potential zombie processes
Write-Info "[*] Checking ports..."
Stop-Port $BackendPort
Stop-Port $FrontendPort

Write-Info ""
Write-Info "[*] Starting services..."
Write-Info ""

# 2. Start Backend (Node/Express API)
Write-Info "[*] Starting Backend (Node/Express API)..."
$ApiScript = "`$Host.UI.RawUI.WindowTitle = 'FastAccounting - API Server (Port $BackendPort)'; Write-Host 'FastAccounting API Server' -ForegroundColor Cyan; Write-Host 'http://localhost:$BackendPort' -ForegroundColor Green; Write-Host ''; Set-Location '$ApiPath'; npm run dev"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $ApiScript

# Wait a bit for API to start
Start-Sleep -Seconds 3

# 3. Start Frontend
Write-Info "[*] Starting Frontend (Vite)..."
$ClientScript = "`$Host.UI.RawUI.WindowTitle = 'FastAccounting - Client (Port $FrontendPort)'; Write-Host 'FastAccounting Client' -ForegroundColor Cyan; Write-Host 'http://localhost:$FrontendPort' -ForegroundColor Green; Write-Host ''; Set-Location '$ClientPath'; npm run dev"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $ClientScript

# Wait a bit for client to start
Start-Sleep -Seconds 5

Write-Info ""
Write-Success "[OK] Started successfully!"
Write-Info ""
Write-Info "[*] Backend:  http://localhost:$BackendPort"
Write-Info "[*] Frontend: http://localhost:$FrontendPort"
Write-Info ""
Write-Warning-Custom "[NOTE] To stop services, close terminal windows or press Ctrl+C"
Write-Info ""
