$BackendPort = 3000
$FrontendPort = 5173

function Kill-Port {
    param([int]$Port)
    $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($process) {
        $pid_val = $process.OwningProcess
        Write-Host "Killing process on port $Port (PID: $pid_val)..." -ForegroundColor Yellow
        try {
            Stop-Process -Id $pid_val -Force -ErrorAction SilentlyContinue
            Write-Host "Port $Port freed." -ForegroundColor Green
        } catch {
             Write-Host "Could not kill process $pid_val. It might probably be already closing." -ForegroundColor Gray
        }
    } else {
        Write-Host "Port $Port is already free." -ForegroundColor Gray
    }
}

Write-Host "Starting FastAccounting..." -ForegroundColor Cyan

# 1. Kill potential zombie processes
Kill-Port $BackendPort
Kill-Port $FrontendPort

# 2. Start Backend (Node/Express API)
Write-Host "Starting Backend (Node/Express API)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api; npm run dev" -WorkingDirectory "$PSScriptRoot"

# 3. Start Frontend
Write-Host "Starting Frontend (Vite)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev" -WorkingDirectory "$PSScriptRoot"

Write-Host "App launching! Backend: http://localhost:$BackendPort, Frontend: http://localhost:$FrontendPort" -ForegroundColor Green
