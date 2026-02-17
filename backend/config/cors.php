<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Pengaturan ini menentukan operasi lintas asal (cross-origin) apa saja
    | yang boleh dijalankan di browser. Ini sangat penting agar React
    | (localhost:5173) bisa memanggil API Laravel (localhost:8000).
    |
    */

    // Mengizinkan akses ke semua jalur yang diawali dengan api/
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Mengizinkan semua metode HTTP (GET, POST, PUT, DELETE, dll.)
    'allowed_methods' => ['*'],

    // Mengizinkan semua asal (Origin). 
    // Anda bisa mengganti '*' menjadi ['http://localhost:5173'] untuk lebih aman.
    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    // Mengizinkan semua header (seperti Content-Type, Authorization, dll.)
    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Set ke true jika Anda nantinya menggunakan sistem login dengan Cookie/Session
    'supports_credentials' => false,

];