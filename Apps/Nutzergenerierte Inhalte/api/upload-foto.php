<?php
/**
 * Nimmt ein Bild-Upload entgegen und speichert es in Media/360/Fotos.
 * POST mit multipart/form-data, Feldname: "foto"
 * Der Server muss PHP mit Schreibrechten auf Media/360/Fotos unterstützen.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache');

function reply($ok, $msg, $file = null) {
    echo json_encode(array('success' => $ok, 'error' => $msg, 'file' => $file), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    reply(false, 'Nur POST erlaubt.');
}

if (!isset($_FILES['foto'])) {
    reply(false, 'Keine Datei gesendet (Feldname muss "foto" sein).');
}

$file = $_FILES['foto'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    $codes = array(
        UPLOAD_ERR_INI_SIZE => 'Datei zu groß (php.ini: upload_max_filesize)',
        UPLOAD_ERR_FORM_SIZE => 'Datei zu groß',
        UPLOAD_ERR_PARTIAL => 'Upload nur teilweise empfangen',
        UPLOAD_ERR_NO_FILE => 'Keine Datei gewählt',
        UPLOAD_ERR_NO_TMP_DIR => 'Server: temporärer Ordner fehlt',
        UPLOAD_ERR_CANT_WRITE => 'Server: konnte nicht schreiben',
        UPLOAD_ERR_EXTENSION => 'Server: Upload durch Erweiterung blockiert'
    );
    $errMsg = isset($codes[$file['error']]) ? $codes[$file['error']] : 'Fehlercode ' . $file['error'];
    reply(false, 'Upload fehlgeschlagen: ' . $errMsg . '.');
}

$baseDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'Media' . DIRECTORY_SEPARATOR . '360' . DIRECTORY_SEPARATOR . 'Fotos';
$allowedExt = array('.jpg', '.jpeg', '.png', '.webp', '.gif');
$maxSize = 100 * 1024 * 1024; // 100 MB

$tmp = $file['tmp_name'];
$name = $file['name'];
$size = $file['size'];

if (!is_uploaded_file($tmp)) {
    reply(false, 'Ungültige Upload-Datei.');
}

if ($size > $maxSize) {
    reply(false, 'Datei zu groß (max. 100 MB).');
}

$ext = strtolower(strrchr($name, '.'));
if (!$ext || !in_array($ext, $allowedExt, true)) {
    reply(false, 'Nur Bilder erlaubt (jpg, png, webp, gif).');
}

if (!is_dir($baseDir)) {
    if (!@mkdir($baseDir, 0755, true)) {
        reply(false, 'Ordner Media/360/Fotos konnte nicht erstellt werden.');
    }
}
if (!is_writable($baseDir)) {
    reply(false, 'Ordner Media/360/Fotos ist nicht beschreibbar (Rechte prüfen).');
}

$safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($name, PATHINFO_FILENAME)) . $ext;
$target = $baseDir . DIRECTORY_SEPARATOR . $safeName;

if (file_exists($target)) {
    $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($name, PATHINFO_FILENAME)) . '_' . time() . $ext;
    $target = $baseDir . DIRECTORY_SEPARATOR . $safeName;
}

if (!move_uploaded_file($tmp, $target)) {
    reply(false, 'Speichern fehlgeschlagen (Rechte oder Pfad prüfen).');
}

reply(true, null, $safeName);
