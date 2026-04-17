<?php
/**
 * PHP Proxy for Branded Media URLs with Slug Mapping
 *
 * Resolves SEO-friendly URL slugs to actual Supabase storage files
 * by querying the media_files table for the url_slug → file_name mapping.
 *
 * Usage in .htaccess:
 *   RewriteRule ^media/(.+)$ /media-proxy.php?file=$1 [L,QSA]
 */

$file = isset($_GET['file']) ? $_GET['file'] : '';

if (empty($file) || preg_match('/\.\./', $file)) {
    http_response_code(400);
    exit('Bad request');
}

$bucket = 'media';
if (isset($_GET['bucket']) && $_GET['bucket'] === 'branding') {
    $bucket = 'branding';
}

$normalizeBucketPath = function ($path) use (&$bucket) {
    $clean = ltrim($path, '/');
    if (strpos($clean, 'media/') === 0) {
        $bucket = 'media';
        $clean = substr($clean, 6);
    } elseif (strpos($clean, 'branding/') === 0) {
        $bucket = 'branding';
        $clean = substr($clean, 9);
    }
    return $clean;
};

// Use the full requested file (including extension) as the slug for lookup
$slug = $file;

// --- Slug-to-file mapping via Supabase REST API ---
$supabaseUrl = 'https://xukkejkvcgixogvbllmf.supabase.co';
$anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1a2tlamt2Y2dpeG9ndmJsbG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMjE5OTUsImV4cCI6MjA4NjY5Nzk5NX0.OAYDM8SFgKAXSN1WMlHkJIwMSA4xwgvH3m05TwUJky0';

$resolvedFile = $file; // default: use the requested path as-is

// Try to resolve slug → actual file_name
$apiUrl = $supabaseUrl . '/rest/v1/media_files?url_slug=eq.' . urlencode($slug) . '&select=file_path&limit=1';
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: ' . $anonKey,
    'Authorization: Bearer ' . $anonKey,
    'Accept: application/json',
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$apiResponse = curl_exec($ch);
$apiCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($apiCode === 200 && $apiResponse) {
    $rows = json_decode($apiResponse, true);
    if (!empty($rows) && isset($rows[0]['file_path'])) {
        $resolvedFile = $rows[0]['file_path'];
    }
}

$resolvedFile = $normalizeBucketPath($resolvedFile);

$fetchFromStorage = function ($targetBucket, $targetFile) use ($supabaseUrl) {
    $storageUrl = $supabaseUrl . '/storage/v1/object/public/' . $targetBucket . '/' . $targetFile;

    $ch = curl_init($storageUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

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
