$clientDir = 'C:\Users\Shurusti\Videos\transrentals-new\node_modules\.prisma\client'
$targetFile = Join-Path $clientDir 'query_engine-windows.dll.node'
$tmpFiles = Get-ChildItem $clientDir -Filter '*.tmp*'
Write-Host 'Found temp files:'
$tmpFiles | ForEach-Object { Write-Host $_.Name }
if ($tmpFiles -and $tmpFiles.Count -gt 0) {
    $firstTmp = $tmpFiles[0]
    Write-Host "Trying to copy $($firstTmp.FullName) to $targetFile"
    try {
        Copy-Item $firstTmp.FullName $targetFile -Force
        Write-Host 'Copy succeeded!'
        # Clean up temp files
        $tmpFiles | ForEach-Object {
            try { Remove-Item $_.FullName -Force } catch {}
        }
    } catch {
        Write-Host "Copy failed: $($_.Exception.Message)"
    }
}
