<?php
/**
 * Listet Verzeichnisinhalt für Explorer-ähnliche Galerie.
 * GET: path = Pfad relativ zum Projektroot (z.B. "Media", "Media/360", "Media/360/Fotos", "Media/360/Fotos/HAUM")
 * Gibt zurück: { path, folders: ["Name", ...], files: ["datei.jpg", ...] }
 * Ordner sowie Bild- und Videodateien. Pfad muss unter dem Projektroot liegen.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$baseDir = dirname(__DIR__);
$allowedExt = array('.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov', '.m4v', '.ogv', '.glb', '.gltf', '.obj');

$path = isset($_GET['path']) ? (string) $_GET['path'] : '';
$path = str_replace(array('\\', "\0"), array('/', ''), $path);
$path = trim($path, '/');
if (strpos($path, '..') !== false) {
    header('HTTP/1.0 400 Bad Request');
    echo json_encode(array('error' => 'Ungültiger Pfad'));
    exit;
}

$fullPath = $path === '' ? $baseDir : $baseDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $path);
$realBase = realpath($baseDir);
$realPath = realpath($fullPath);

if ($realBase === false || $realPath === false || strpos($realPath, $realBase) !== 0 || !is_dir($realPath)) {
    header('HTTP/1.0 404 Not Found');
    echo json_encode(array('error' => 'Ordner nicht gefunden', 'path' => $path));
    exit;
}

$folders = array();
$files = array();

// Oberste Ebene: nur Ordner "Media" anzeigen
if ($path === '') {
    if (is_dir($baseDir . DIRECTORY_SEPARATOR . 'Media')) {
        $folders[] = 'Media';
    }
} else {
    $items = @scandir($realPath);
    if ($items !== false) {
        foreach ($items as $name) {
            if ($name === '.' || $name === '..') continue;
            $child = $realPath . DIRECTORY_SEPARATOR . $name;
            if (is_dir($child)) {
                $folders[] = $name;
            } elseif (is_file($child)) {
                $ext = strtolower(strrchr($name, '.'));
                if ($ext && in_array($ext, $allowedExt, true)) {
                    $files[] = $name;
                }
            }
        }
        sort($folders);
        sort($files);
    }
}

echo json_encode(array(
    'path' => $path,
    'folders' => $folders,
    'files' => $files
), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
