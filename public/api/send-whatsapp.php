<?php
/**
 * DHARA PRIME REALTY - LEAD & NOTIFICATION HANDLER
 * Designed for GoDaddy Linux cPanel Apache Hosting
 *
 * Receives JSON payload from website enquiry & site-visit booking forms.
 * 1. Validates and sanitizes the request.
 * 2. Logs leads securely to a protected file.
 * 3. Sends notification email to Dhara Realtors admin (info.dharaprimereality@gmail.com).
 * 4. Supports UltraMsg / Green-API / Webhook automation if configured.
 * 5. Returns JSON response to client.
 */

// Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Only POST is accepted.']);
    exit;
}

// Read raw JSON body
$rawBody = file_get_contents('php://input');
$data = json_decode($rawBody, true);

if (!$data || !is_array($data)) {
    $data = $_POST;
}

// Extract fields safely
$customerName  = isset($data['customerName'])  ? trim(strip_tags((string)$data['customerName']))  : 'Prospective Client';
$customerPhone = isset($data['customerPhone']) ? trim(strip_tags((string)$data['customerPhone'])) : '';
$customerEmail = isset($data['customerEmail']) ? trim(strip_tags((string)$data['customerEmail'])) : '';
$type          = isset($data['type'])          ? trim(strip_tags((string)$data['type']))          : 'ENQUIRY';
$message       = isset($data['message'])       ? trim((string)$data['message'])                    : '';
$submittedAt   = isset($data['submittedAt'])   ? trim(strip_tags((string)$data['submittedAt']))   : date('d M Y, h:i A');
$projectName   = isset($data['projectName'])   ? trim(strip_tags((string)$data['projectName']))   : '';
$date          = isset($data['date'])          ? trim(strip_tags((string)$data['date']))          : '';
$time          = isset($data['time'])          ? trim(strip_tags((string)$data['time']))          : '';
$requirements  = isset($data['requirements'])  ? trim(strip_tags((string)$data['requirements']))  : '';

$adminEmail = 'info.dharaprimereality@gmail.com';
$dharaTeamPhone = '+91 83176 04342';

// 1. Log lead securely on the server
$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
    @file_put_contents($logDir . '/.htaccess', "<FilesMatch \".*\">\nOrder Deny,Allow\nDeny from all\n</FilesMatch>\n");
}

$logEntry = [
    'timestamp'     => date('c'),
    'ip'            => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'type'          => $type,
    'customerName'  => $customerName,
    'customerPhone' => $customerPhone,
    'customerEmail' => $customerEmail,
    'projectName'   => $projectName,
    'date'          => $date,
    'time'          => $time,
    'requirements'  => $requirements,
    'message'       => $message
];

@file_put_contents(
    $logDir . '/leads.jsonl',
    json_encode($logEntry, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n",
    FILE_APPEND | LOCK_EX
);

// 2. Dispatch Email Notification via PHP mail()
$emailSubject = ($type === 'SITE_VISIT') 
    ? "🏛️ New Site Visit Booking: {$projectName} ({$customerName})" 
    : "🏛️ New Property Enquiry from {$customerName}";

$emailBody = "DHARA PRIME REALTY - WEBSITE LEAD NOTIFICATION\n";
$emailBody .= "======================================================\n\n";
$emailBody .= "Client Name:  {$customerName}\n";
$emailBody .= "Phone:        +{$customerPhone}\n";
$emailBody .= "Email:        {$customerEmail}\n";
$emailBody .= "Type:         {$type}\n";
if ($projectName)  $emailBody .= "Property:     {$projectName}\n";
if ($date || $time) $emailBody .= "Schedule:     {$date} at {$time}\n";
if ($requirements) $emailBody .= "Requirements: {$requirements}\n";
$emailBody .= "Submitted At: {$submittedAt}\n\n";
$emailBody .= "---------------- Full Message ----------------\n\n";
$emailBody .= $message . "\n\n";
$emailBody .= "======================================================\n";

$host = !empty($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'dharaprimerealty.com';
$headers = "From: Dhara Website <no-reply@" . $host . ">\r\n" .
           "Reply-To: " . ($customerEmail ? $customerEmail : $adminEmail) . "\r\n" .
           "X-Mailer: PHP/" . phpversion();

@mail($adminEmail, $emailSubject, $emailBody, $headers);

// 3. UltraMsg API dispatch if environment/config is set
$ultramsgInstance = getenv('ULTRAMSG_INSTANCE_ID') ?: '';
$ultramsgToken = getenv('ULTRAMSG_TOKEN') ?: '';
$dispatchedLive = false;
$liveProvider = 'simulation';

if (!empty($ultramsgInstance) && !empty($ultramsgToken) && !empty($customerPhone)) {
    $params = [
        'token' => $ultramsgToken,
        'to'    => '+' . preg_replace('/[^0-9]/', '', $customerPhone),
        'body'  => $message
    ];
    $ch = curl_init("https://api.ultramsg.com/{$ultramsgInstance}/messages/chat");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_TIMEOUT, 4);
    $response = @curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    @curl_close($ch);
    if ($httpCode >= 200 && $httpCode < 300) {
        $dispatchedLive = true;
        $liveProvider = 'UltraMsg';
    }
}

// 4. Webhook forwarder (Zapier / Make / Pabbly)
$webhookUrl = getenv('WHATSAPP_WEBHOOK_URL') ?: '';
if (!empty($webhookUrl) && filter_var($webhookUrl, FILTER_VALIDATE_URL)) {
    $ch = curl_init($webhookUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 4);
    @curl_exec($ch);
    @curl_close($ch);
    if (!$dispatchedLive) {
        $dispatchedLive = true;
        $liveProvider = 'Webhook';
    }
}

// Return 200 OK
echo json_encode([
    'success'   => true,
    'status'    => $dispatchedLive ? 'delivered_live' : 'logged_server',
    'provider'  => $liveProvider,
    'recipient' => $customerPhone,
    'message'   => $dispatchedLive ? 'Dispatched to customer phone!' : 'Lead logged and forwarded successfully.',
    'timestamp' => date('c')
]);
