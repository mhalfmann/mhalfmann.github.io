# Scans Apps/ and writes apps.json for the catalog page.
# Run after adding/removing apps:  powershell -File .\generate-apps.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$appsDir = Join-Path $root "Apps"
$outFile = Join-Path $root "apps.json"
$outJs = Join-Path $root "Javascript\apps-data.js"

# Optional overrides: entry, image, title, modes (scene picker), extra links
$meta = @{
  Unwetter = @{
    title = "Unwetter"
    image = "./Assets/Images/blitz.jpg"
    modes = 5
    query = "?Test#"
  }
  Insel = @{
    title = "Insel"
    image = "./Assets/Images/insel.jpg"
    modes = 2
    query = "?Test#"
  }
  Info04 = @{
    title = "Info04"
    image = "./Assets/Images/info.png"
  }
  TestMolekuele = @{
    title = "Molekuele"
    image = "./Assets/Images/molekuel.png"
    entry = "indexStart.html"
    extras = @(
      @{
        label = "Marker PDF"
        href  = "./Apps/TestMolekuele/assets/marker/Marker.pdf"
        icon  = "./Assets/Icons/pdf.png"
      }
    )
  }
  Museum = @{
    title = "Museum"
    image = "./Assets/Images/MuesumHall.png"
  }
  MuseumTwoRooms = @{
    title = "Museum 2 Rooms"
    image = "./Assets/Images/Museum2.png"
  }
  MuseumBuilder = @{
    title = "Museum Builder"
    image = "./Assets/Images/museum.png"
  }
}

function Find-Entry($dir) {
  foreach ($name in @("index.html", "indexStart.html", "index.htm")) {
    $path = Join-Path $dir $name
    if (Test-Path $path) { return $name }
  }
  return $null
}

function Guess-Image($folderName) {
  $imagesDir = Join-Path $root "Assets\Images"
  if (-not (Test-Path $imagesDir)) { return "./Assets/Images/testapp.png" }

  $candidates = @(
    "$folderName.png",
    "$folderName.jpg",
    ($folderName.ToLower() + ".png"),
    ($folderName.ToLower() + ".jpg")
  )
  foreach ($c in $candidates) {
    if (Test-Path (Join-Path $imagesDir $c)) {
      return "./Assets/Images/$c"
    }
  }
  return "./Assets/Images/testapp.png"
}

$apps = @()
Get-ChildItem -Path $appsDir -Directory | Sort-Object Name | ForEach-Object {
  $folder = $_.Name
  $override = $meta[$folder]
  $entry = if ($override -and $override.entry) { $override.entry } else { Find-Entry $_.FullName }

  if (-not $entry) {
    Write-Warning "Skipping $folder (no index.html / indexStart.html)"
    return
  }

  $href = "./Apps/$folder/$entry"
  if ($override -and $override.query) {
    $href += $override.query
  }

  $app = [ordered]@{
    id    = $folder
    title = if ($override -and $override.title) { $override.title } else { $folder }
    href  = $href
    image = if ($override -and $override.image) { $override.image } else { Guess-Image $folder }
  }

  if ($override -and $null -ne $override.modes) {
    $app.modes = [int]$override.modes
  }
  if ($override -and $override.extras) {
    $app.extras = $override.extras
  }

  $apps += [pscustomobject]$app
}

$payload = [ordered]@{
  generated = (Get-Date).ToString("o")
  apps      = $apps
}

$json = $payload | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($outFile, $json, [System.Text.UTF8Encoding]::new($false))

$js = "window.APPS_CATALOG = " + $json + ";" + [Environment]::NewLine
[System.IO.File]::WriteAllText($outJs, $js, [System.Text.UTF8Encoding]::new($false))

Write-Host "Wrote $($apps.Count) apps to $outFile and $outJs"
