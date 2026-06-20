<?php
declare(strict_types=1);

$distIndex = __DIR__ . DIRECTORY_SEPARATOR . 'dist' . DIRECTORY_SEPARATOR . 'index.html';

if (!is_file($distIndex)) {
    http_response_code(503);
    header('Content-Type: text/html; charset=utf-8');
    ?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Cohere Proofreader</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f3f4f6; color: #1f2937; margin: 0; }
      main { max-width: 720px; margin: 10vh auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,.08); }
      code { background: #f3f4f6; padding: 2px 6px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Cohere Proofreader</h1>
      <p>The Laragon entrypoint is ready, but the production bundle has not been built yet.</p>
      <p>Run <code>npm install</code>, then <code>npm run build:laragon</code>, and refresh this page.</p>
    </main>
  </body>
</html>
    <?php
    exit;
}

header('Content-Type: text/html; charset=utf-8');
readfile($distIndex);
