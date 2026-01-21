cd 'C:\Users\Shurusti\Videos\transrentals-new\node_modules\.prisma\client'

# Get all query engine files
$files = Get-ChildItem -Filter 'query_engine*'
Write-Host "Found files:"
$files | ForEach-Object { Write-Host $_.Name }

# Delete the original file if it exists
$originalFile = $files | Where-Object { $_.Name -eq 'query_engine-windows.dll.node' }
if ($originalFile) {
    try {
        Remove-Item $originalFile.FullName -Force
        Write-Host "Deleted original file"
    } catch {
        Write-Host "Could not delete original file: $_"
    }
}

# Find a temp file and rename it
$tempFile = $files | Where-Object { $_.Name -like '*.tmp*' } | Select-Object -First 1
if ($tempFile) {
    try {
        Rename-Item $tempFile.FullName -NewName 'query_engine-windows.dll.node' -Force
        Write-Host "Renamed $($tempFile.Name) to query_engine-windows.dll.node"
    } catch {
        Write-Host "Could not rename: $_"
    }
}
