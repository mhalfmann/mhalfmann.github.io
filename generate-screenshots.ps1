# Scans Assets/Screenshots/* and writes screenshots.json + Javascript/screenshots-data.js
# Run after adding images:  powershell -File .\generate-screenshots.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$shotsDir = Join-Path $root "Assets\Screenshots"
$outFile = Join-Path $root "screenshots.json"
$outJs = Join-Path $root "Javascript\screenshots-data.js"

$albumTitles = @{
  Lego            = "Lego"
  FlightSimulator = "Flight Simulator"
}

$albums = @()
Get-ChildItem -Path $shotsDir -Directory | Sort-Object Name | ForEach-Object {
  $folder = $_.Name
  $images = Get-ChildItem -Path $_.FullName -File |
    Where-Object { $_.Extension -match '\.(png|jpe?g|webp|gif)$' } |
    Sort-Object {
      $n = 0
      if ([int]::TryParse([IO.Path]::GetFileNameWithoutExtension($_.Name), [ref]$n)) { $n } else { 9999 }
    }, Name

  if (-not $images) { return }

  $album = [ordered]@{
    id     = $folder
    title  = if ($albumTitles.ContainsKey($folder)) { $albumTitles[$folder] } else { $folder }
    images = @(
      $images | ForEach-Object {
        [ordered]@{
          src   = "./Assets/Screenshots/$folder/$($_.Name)"
          alt   = "$folder $($_.BaseName)"
        }
      }
    )
  }
  $albums += [pscustomobject]$album
}

$payload = [ordered]@{
  generated = (Get-Date).ToString("o")
  albums    = $albums
}

$json = $payload | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($outFile, $json, [System.Text.UTF8Encoding]::new($false))
$js = "window.SCREENSHOTS_CATALOG = " + $json + ";" + [Environment]::NewLine
[System.IO.File]::WriteAllText($outJs, $js, [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $($albums.Count) albums to $outFile"
