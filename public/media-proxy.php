<?php
/**
 * Local media proxy for branded URLs.
 *
 * Usage in .htaccess:
 *   RewriteRule ^media/(.+)$ /media-proxy.php?file=$1 [L,QSA]
 */

$file = isset($_GET['file']) ? $_GET['file'] : '';

if (empty($file) || preg_match('/\.\./', $file)) {
    http_response_code(400);
    exit('Bad request');
}

$normalizeBucketPath = function ($path) {
    $clean = ltrim($path, '/');
    if (strpos($clean, 'media/') === 0) {
        $clean = substr($clean, 6);
    } elseif (strpos($clean, 'branding/') === 0) {
        $clean = 'logos/' . substr($clean, 9);
    }
    return $clean;
};

$serveLocalPublicImage = function ($path) {
    $clean = ltrim($path, '/');
    $candidates = [$clean];


    $resolveFromIndex = function ($slug) {
        $indexPath = __DIR__ . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . '.media-index.json';
        if (!is_file($indexPath)) {
            return null;
        }

        $raw = file_get_contents($indexPath);
        if ($raw === false || $raw === '') {
            return null;
        }

        $records = json_decode($raw, true);
        if (!is_array($records)) {
            return null;
        }

        foreach ($records as $record) {
            if (!is_array($record)) {
                continue;
            }

            $urlSlug = isset($record['url_slug']) ? ltrim((string)$record['url_slug'], '/') : '';
            $filePath = isset($record['file_path']) ? ltrim((string)$record['file_path'], '/') : '';

            if ($urlSlug !== '' && $urlSlug === ltrim($slug, '/')) {
                return $filePath;
            }
        }

        return null;
    };

    $resolvedFromIndex = $resolveFromIndex($localCandidate);
    if ($resolvedFromIndex) {
        $serveLocalPublicImage($resolvedFromIndex);
    }

    http_response_code(404);
    exit('File not found');
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);

    return [
        'httpCode' => $httpCode,
        'headers' => $response ? substr($response, 0, $headerSize) : '',
        'body' => $response ? substr($response, $headerSize) : '',
    ];
};

// Fetch from selected bucket first, then fallback to the other bucket.
$result = $fetchFromStorage($bucket, $resolvedFile);
$httpCode = $result['httpCode'];
$headers = $result['headers'];
$body = $result['body'];

if ($httpCode !== 200) {
    $fallbackBucket = $bucket === 'media' ? 'branding' : 'media';
    $fallbackResult = $fetchFromStorage($fallbackBucket, $resolvedFile);
    if ($fallbackResult['httpCode'] === 200) {
        $httpCode = 200;
        $headers = $fallbackResult['headers'];
        $body = $fallbackResult['body'];
    }
}

if ($httpCode !== 200) {
    http_response_code($httpCode ?: 404);
    exit('File not found');
}

// Extract content-type
if (preg_match('/content-type:\s*([^\r\n]+)/i', $headers, $m)) {
    header('Content-Type: ' . trim($m[1]));
} else {
    header('Content-Type: application/octet-stream');
}

// Cache for 1 year (files are hashed/immutable)
header('Cache-Control: public, max-age=31536000, immutable');
header('X-Content-Type-Options: nosniff');

echo $body;
