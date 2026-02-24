<?php
/**
 * Listet Bilddateien in Media/360/Fotos rekursiv auf (inkl. Unterordner) und gibt sie als JSON zurück.
 * Wird von der Galerie beim Klick auf "Aktualisieren" (und optional beim Laden) aufgerufen.
 * Der Server muss PHP unterstützen.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$baseDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'Media' . DIRECTORY_SEPARATOR . '360' . DIRECTORY_SEPARATOR . 'Fotos';
$allowed = array('.jpg', '.jpeg', '.png', '.webp', '.gif');

$folders = array();

function scanFotosDir($dir, $baseDir, $allowed, $relativePath = '') {
    $files = array();
    if (!is_dir($dir)) return;
    $items = @scandir($dir);
    if ($items === false) return;
    foreach ($items as $name) {
        if ($name === '.' || $name === '..') continue;
        $full = $dir . DIRECTORY_SEPARATOR . $name;
        if (is_dir($full)) {
            $subRel = $relativePath === '' ? $name : $relativePath . '/' . $name;
            yield from scanFotosDir($full, $baseDir, $allowed, $subRel);
            continue;
        }
        $ext = strtolower(strrchr($name, '.'));
        if ($ext && in_array($ext, $allowed, true)) {
            $files[] = $name;
        }
    }
    if (!empty($files)) {
        sort($files);
        yield $relativePath => $files;
    }
}

if (is_dir($baseDir)) {
    foreach (scanFotosDir($baseDir, $baseDir, $allowed) as $rel => $files) {
        $key = str_replace(DIRECTORY_SEPARATOR, '/', $rel);
        $folders[$key] = $files;
    }
    ksort($folders);
}

echo json_encode(array(
    'folders' => $folders,
    'updated' => date('c')
), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
