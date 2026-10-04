# Start all development services
Write-Host "Starting Interview AI Development Environment..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/api-node; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/web; npm run dev"

Write-Host "Backend API: http://localhost:8001" -ForegroundColor Green
Write-Host "Frontend Web: http://localhost:5173" -ForegroundColor Green
