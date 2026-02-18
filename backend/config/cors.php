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

    'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => ['*'], // Atau ['http://localhost:5173'] agar lebih spesifik
'allowed_headers' => ['*'],
'supports_credentials' => true,

];