# Generiert list.json aus dem Ordner Media/360/Fotos (inkl. Unterordner).
# Ausführen: .\scripts\generate-list.ps1
# Oder: powershell -ExecutionPolicy Bypass -File scripts\generate-list.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$fotosDir = Join-Path $scriptDir "..\Media\360\Fotos"
$listFile = Join-Path $fotosDir "list.json"
$imageExt = @(".jpg", ".jpeg", ".png", ".webp", ".gif")

if (-not (Test-Path $fotosDir)) {
    New-Item -ItemType Directory -Path $fotosDir -Force | Out-Null
    Write-Host "Ordner erstellt: $fotosDir"
}

function Get-FotosFolders {
    param([string]$Dir, [string]$RelativePath = "")
    $folders = @{}
    Get-ChildItem -Path $Dir -Directory | ForEach-Object {
        $subRel = if ($RelativePath) { "$RelativePath/$($_.Name)" } else { $_.Name }
        $sub = Get-FotosFolders -Dir $_.FullName -RelativePath $subRel
        foreach ($k in $sub.Keys) { $folders[$k] = $sub[$k] }
    }
    $files = Get-ChildItem -Path $Dir -File |
        Where-Object { $imageExt -contains $_.Extension.ToLower() } |
        ForEach-Object { $_.Name } |
        Sort-Object
    if ($files.Count -gt 0) {
        $folders[$RelativePath] = @($files)
    }
    $folders
}

$folders = Get-FotosFolders -Dir $fotosDir
$total = ($folders.Values | ForEach-Object { $_.Count } | Measure-Object -Sum).Sum
$listObj = @{ folders = $folders; updated = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") }
$json = $listObj | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($listFile, $json, [System.Text.Encoding]::UTF8)

Write-Host "list.json erstellt mit $($folders.Count) Ordner(n) und $total Bild(ern): $listFile"
