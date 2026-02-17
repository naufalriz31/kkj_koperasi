<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    /**
     * Mengambil jumlah notifikasi yang belum dibaca (is_read = 0)
     */
    public function unreadCount(Request $request)
    {
        // Menghitung data berdasarkan user yang sedang login
        $count = DB::table('notifications')
            ->where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'status' => 'success',
            'count' => $count
        ]);
    }

    /**
     * Mengambil daftar notifikasi lengkap
     */
    public function index(Request $request)
    {
        $notifications = DB::table('notifications')
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notifications);
    }
}