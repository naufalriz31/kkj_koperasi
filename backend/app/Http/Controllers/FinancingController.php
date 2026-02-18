<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FinancingController extends Controller
{
    public function index()
    {
        return response()->json([]);
    }

    public function apply(Request $request)
    {
        return response()->json(['message' => 'Pengajuan berhasil dikirim']);
    }
}