<?php
/**
 * Liefert Thumbnails für Galerie-Bilder. Vollautomatisch: Bild wird bei jedem
 * Aufruf runterskaliert (max. 320px Breite) und aus dem Speicher ausgegeben.
 * GET: path = Pfad relativ zu Media (z.B. "360/Fotos/HAUM/photo.jpg" oder "360 Grad/Fotos/Aachen/DWI/photo.jpg")
 * Voraussetzung: PHP mit GD-Erweiterung (extension=gd).
 */
$mediaDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'Media';
$thumbDir = $mediaDir . DIRECTORY_SEPARATOR . 'Thumbnails';
$maxWidth = 320;
$jpegQuality = 85;

$path = isset($_GET['path']) ? (string) $_GET['path'] : '';
$path = str_replace(array('\\', "\0"), array('/', ''), $path);
$path = trim($path, '/');
if ($path === '' || strpos($path, '..') !== false) {
    header('HTTP/1.0 400 Bad Request');
    exit;
}

$originalFile = $mediaDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $path);
$realMedia = realpath($mediaDir);
$realFile = realpath($originalFile);
if ($realMedia === false || $realFile === false || strpos($realFile, $realMedia) !== 0) {
    header('HTTP/1.0 404 Not Found');
    exit;
}
$thumbRel = preg_replace('/\.[a-z]+$/i', '.jpg', $path);
$thumbFile = $thumbDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $thumbRel);

if (!is_file($originalFile) || !is_readable($originalFile)) {
    header('HTTP/1.0 404 Not Found');
    exit;
}

$allowedExt = array('.jpg', '.jpeg', '.png', '.webp', '.gif');
$ext = strtolower(strrchr($path, '.'));
if (!in_array($ext, $allowedExt, true)) {
    header('HTTP/1.0 400 Bad Request');
    exit;
}

if (!extension_loaded('gd')) {
    header('HTTP/1.0 503 Service Unavailable');
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    echo 'Thumbnails benötigen die PHP-GD-Erweiterung (php.ini: extension=gd).';
    exit;
}

// Optional: gecachte Thumbnail-Datei ausliefern (spart CPU)
if (is_file($thumbFile) && is_readable($thumbFile)) {
    $etag = '"' . md5_file($thumbFile) . '"';
    header('Content-Type: image/jpeg');
    header('Cache-Control: public, max-age=31536000');
    header('Etag: ' . $etag);
    if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
        header('HTTP/1.1 304 Not Modified');
        exit;
    }
    header('Content-Length: ' . filesize($thumbFile));
    readfile($thumbFile);
    exit;
}

$info = @getimagesize($originalFile);
if ($info === false || $info[0] <= 0 || $info[1] <= 0) {
    header('HTTP/1.0 500 Internal Server Error');
    exit;
}

$srcW = $info[0];
$srcH = $info[1];
$dstW = min($maxWidth, $srcW);
$dstH = (int) round($srcH * $dstW / $srcW);
if ($dstH < 1) $dstH = 1;

$src = null;
switch ($info[2]) {
    case IMAGETYPE_JPEG:
        $src = @imagecreatefromjpeg($originalFile);
        break;
    case IMAGETYPE_PNG:
        $src = @imagecreatefrompng($originalFile);
        break;
    case IMAGETYPE_GIF:
        $src = @imagecreatefromgif($originalFile);
        break;
    case IMAGETYPE_WEBP:
        if (function_exists('imagecreatefromwebp')) {
            $src = @imagecreatefromwebp($originalFile);
        }
        break;
}
if ($src === false || $src === null) {
    header('HTTP/1.0 500 Internal Server Error');
    exit;
}

$dst = imagecreatetruecolor($dstW, $dstH);
if ($dst === false) {
    imagedestroy($src);
    header('HTTP/1.0 500 Internal Server Error');
    exit;
}

imagecopyresampled($dst, $src, 0, 0, 0, 0, $dstW, $dstH, $srcW, $srcH);
imagedestroy($src);

// Optional: Thumbnail auf Disk cachen (wenn beschreibbar)
$thumbDirParent = dirname($thumbFile);
if (!is_dir($thumbDirParent)) {
    @mkdir($thumbDirParent, 0755, true);
}
if (is_dir($thumbDirParent) && is_writable($thumbDirParent)) {
    @imagejpeg($dst, $thumbFile, $jpegQuality);
}

// Immer: verkleinertes Bild direkt aus dem Speicher ausliefern (kein Schreibrecht nötig)
header('Content-Type: image/jpeg');
header('Cache-Control: public, max-age=86400');
header('Content-Disposition: inline; filename="thumb.jpg"');
imagejpeg($dst, null, $jpegQuality);
imagedestroy($dst);
exit;
