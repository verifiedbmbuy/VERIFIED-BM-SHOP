<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$imagesDir = __DIR__ . DIRECTORY_SEPARATOR . 'images';
$indexFile = $imagesDir . DIRECTORY_SEPARATOR . '.media-index.json';

if (!is_dir($imagesDir)) {
    mkdir($imagesDir, 0775, true);
}

function jsonResponse($payload, $status = 200) {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function readJsonInput() {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function safeSegment($value) {
    $value = strtolower((string) $value);
    $value = preg_replace('/[^a-z0-9\-_\.]+/', '-', $value);
    $value = preg_replace('/-+/', '-', $value);
    return trim($value, '-');
}

function safePrefix($value) {
    $value = str_replace('\\', '/', (string) $value);
    $parts = array_filter(explode('/', $value));
    $safe = [];
    foreach ($parts as $part) {
        $segment = safeSegment($part);
        if ($segment !== '') $safe[] = $segment;
    }
    return implode('/', $safe);
}

function readIndex($indexFile) {
    if (!is_file($indexFile)) return [];
    $raw = file_get_contents($indexFile);
    if ($raw === false || $raw === '') return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function writeIndex($indexFile, $records) {
    file_put_contents($indexFile, json_encode(array_values($records), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function buildPublicUrl($filePath) {
    return '/images/' . ltrim(str_replace('\\', '/', $filePath), '/');
}

$action = isset($_GET['action']) ? $_GET['action'] : 'list';

if ($action === 'list') {
    $records = readIndex($indexFile);
    usort($records, function ($a, $b) {
        return strcmp((string)($b['created_at'] ?? ''), (string)($a['created_at'] ?? ''));
    });
    jsonResponse(['files' => $records]);
}

if ($action === 'upload') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['error' => 'Method not allowed'], 405);
    }

    if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
        jsonResponse(['error' => 'No file uploaded'], 400);
    }

    $prefix = isset($_POST['pathPrefix']) ? safePrefix($_POST['pathPrefix']) : '';
    $incomingSlug = isset($_POST['slug']) ? (string)$_POST['slug'] : (string)$_FILES['file']['name'];
    $incomingExt = strtolower(pathinfo($incomingSlug, PATHINFO_EXTENSION));
    if ($incomingExt === '') {
        $incomingExt = strtolower(pathinfo((string)$_FILES['file']['name'], PATHINFO_EXTENSION));
    }
    $allowedExt = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'avif'];
    $extension = in_array($incomingExt, $allowedExt, true) ? $incomingExt : 'webp';

    $slugBase = pathinfo($incomingSlug, PATHINFO_FILENAME);
    $safeName = safeSegment($slugBase);
    if ($safeName === '') $safeName = 'image-' . time();
    $fileName = $safeName . '.' . $extension;

    $targetDir = $imagesDir;
    if ($prefix !== '') {
        $targetDir = $imagesDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $prefix);
    }
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0775, true);
    }

    $targetPath = $targetDir . DIRECTORY_SEPARATOR . $fileName;
    $counter = 1;
    while (is_file($targetPath)) {
        $fileName = $safeName . '-' . $counter . '.' . $extension;
        $targetPath = $targetDir . DIRECTORY_SEPARATOR . $fileName;
        $counter++;
    }

    if (!move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
        jsonResponse(['error' => 'Failed to write file'], 500);
    }

    $relativePath = $prefix !== '' ? ($prefix . '/' . $fileName) : $fileName;
    $publicUrl = buildPublicUrl($relativePath);
    $size = filesize($targetPath);
    $mime = function_exists('mime_content_type') ? mime_content_type($targetPath) : 'image/webp';

    $width = 0;
    $height = 0;
    $imageInfo = @getimagesize($targetPath);
    if (is_array($imageInfo)) {
        $width = (int)$imageInfo[0];
        $height = (int)$imageInfo[1];
    }

    $now = gmdate('c');
    $id = bin2hex(random_bytes(8));

    $record = [
        'id' => $id,
        'file_name' => isset($_POST['fileName']) && trim((string)$_POST['fileName']) !== '' ? trim((string)$_POST['fileName']) : pathinfo($fileName, PATHINFO_FILENAME),
        'file_path' => $relativePath,
        'file_size' => $size !== false ? (int)$size : 0,
        'mime_type' => $mime ?: 'image/webp',
        'width' => $width,
        'height' => $height,
        'alt_text' => isset($_POST['altText']) ? trim((string)$_POST['altText']) : '',
        'caption' => isset($_POST['caption']) ? trim((string)$_POST['caption']) : '',
        'description' => isset($_POST['description']) ? trim((string)$_POST['description']) : '',
        'url' => $publicUrl,
        'url_slug' => $fileName,
        'created_at' => $now,
    ];

    $records = readIndex($indexFile);
    array_unshift($records, $record);
    writeIndex($indexFile, $records);

    jsonResponse(['file' => $record], 201);
}

if ($action === 'update') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['error' => 'Method not allowed'], 405);
    }

    $input = readJsonInput();
    $id = isset($input['id']) ? (string)$input['id'] : '';
    $data = isset($input['data']) && is_array($input['data']) ? $input['data'] : [];

    if ($id === '') {
        jsonResponse(['error' => 'id is required'], 400);
    }

    $allowed = ['alt_text', 'caption', 'description', 'url_slug', 'file_name'];
    $records = readIndex($indexFile);
    $updated = false;

    foreach ($records as &$record) {
        if (($record['id'] ?? '') !== $id) continue;
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $record[$field] = is_string($data[$field]) ? trim($data[$field]) : $data[$field];
            }
        }
        $updated = true;
        break;
    }

    if (!$updated) {
        jsonResponse(['error' => 'File not found'], 404);
    }

    writeIndex($indexFile, $records);
    jsonResponse(['ok' => true]);
}

if ($action === 'delete') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['error' => 'Method not allowed'], 405);
    }

    $input = readJsonInput();
    $ids = [];

    if (isset($input['ids']) && is_array($input['ids'])) {
        $ids = array_map('strval', $input['ids']);
    } elseif (isset($input['id'])) {
        $ids = [strval($input['id'])];
    }

    if (count($ids) === 0) {
        jsonResponse(['error' => 'id or ids is required'], 400);
    }

    $records = readIndex($indexFile);
    $remaining = [];

    foreach ($records as $record) {
        $recordId = isset($record['id']) ? (string)$record['id'] : '';
        if (!in_array($recordId, $ids, true)) {
            $remaining[] = $record;
            continue;
        }

        $relativePath = isset($record['file_path']) ? str_replace('/', DIRECTORY_SEPARATOR, ltrim((string)$record['file_path'], '/')) : '';
        if ($relativePath !== '') {
            $fullPath = $imagesDir . DIRECTORY_SEPARATOR . $relativePath;
            if (is_file($fullPath)) {
                @unlink($fullPath);
            }
        }
    }

    writeIndex($indexFile, $remaining);
    jsonResponse(['ok' => true, 'deleted' => count($ids)]);
}

jsonResponse(['error' => 'Unknown action'], 400);
