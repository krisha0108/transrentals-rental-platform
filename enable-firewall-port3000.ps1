# Enable Port 3000 for Next.js Development Server
# Run this script as Administrator

Write-Host "Adding Windows Firewall rule for port 3000..." -ForegroundColor Cyan

try {
    # Check if rule already exists
    $existingRule = Get-NetFirewallRule -DisplayName "Next.js Dev Server" -ErrorAction SilentlyContinue

    if ($existingRule) {
        Write-Host "Rule already exists. Removing old rule..." -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName "Next.js Dev Server"
    }

    # Add new firewall rule
    New-NetFirewallRule -DisplayName "Next.js Dev Server" `
                        -Direction Inbound `
                        -LocalPort 3000 `
                        -Protocol TCP `
                        -Action Allow `
                        -Profile Domain,Private,Public `
                        -Description "Allow inbound connections to Next.js development server on port 3000"

    Write-Host "✅ Firewall rule added successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Testing connection..." -ForegroundColor Cyan

    # Test if server is running
    $response = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet

    if ($response) {
        Write-Host "✅ Port 3000 is accessible!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your mobile app should now be able to connect to:" -ForegroundColor White
        Write-Host "http://192.168.29.31:3000" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Port 3000 is not responding. Make sure your Next.js server is running." -ForegroundColor Yellow
        Write-Host "Run: npm run dev" -ForegroundColor Cyan
    }

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you're running PowerShell as Administrator" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
