<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    // =========================================================================
    // 1. REGISTER
    // =========================================================================
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|max:20|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => 'member',
            'status' => 'pending',
            'tapro_balance' => 0,
            'member_id' => 'REG-' . time(),
        ]);

        return response()->json([
            'message' => 'Registrasi berhasil. Silakan tunggu verifikasi admin.',
            'user' => $user,
        ], 201);
    }

    // =========================================================================
    // 2. LOGIN
    // =========================================================================
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email atau Password salah'], 401);
        }

        if ($user->role !== 'admin' && $user->status === 'pending') {
            return response()->json(['message' => 'Akun Anda sedang dalam proses verifikasi admin.'], 403);
        }

        if ($user->status === 'rejected') {
            return response()->json(['message' => 'Maaf, pendaftaran Anda ditolak.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'user' => $user, 
            'token' => $token
        ]);
    }

    // =========================================================================
    // 3. LOGOUT
    // =========================================================================
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }

    // =========================================================================
    // 4. GET USER PROFILE (Check Session)
    // =========================================================================
    public function user(Request $request)
    {
        // Ambil data terbaru langsung dari DB (Anti-Cache)
        $user = User::find($request->user()->id);
        return response()->json($user);
    }

    // =========================================================================
    // 5. UPDATE PROFILE
    // =========================================================================
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
        ]);

        $user = Auth::user();
        $user->update([
            'name' => $request->name,
            'phone' => $request->phone
        ]);

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user' => $user
        ]);
    }

    // =========================================================================
    // 6. UPDATE AVATAR (LIMIT 10MB)
    // =========================================================================
    public function updateAvatar(Request $request)
    {
        $request->validate([
            // [FIX]: Limit dinaikkan dari 2048 (2MB) menjadi 10240 (10MB)
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240',
        ]);

        $user = Auth::user();

        // Hapus avatar lama jika ada
        if ($user->avatar_url) {
            // Mengubah URL lengkap menjadi path relatif untuk storage
            $oldPath = str_replace(url('/storage/'), '', $user->avatar_url);
            // Cek apakah file ada sebelum hapus untuk menghindari error
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        // Simpan avatar baru
        $path = $request->file('avatar')->store('avatars', 'public');
        $url = url('/storage/' . $path);
        
        $user->update(['avatar_url' => $url]);

        return response()->json([
            'message' => 'Foto profil berhasil diperbarui',
            'avatar_url' => $url
        ]);
    }

    // =========================================================================
    // 7. UPDATE PIN TRANSAKSI
    // =========================================================================
    public function updatePin(Request $request)
    {
        $request->validate([
            'pin' => 'required|string|size:6', 
        ]);

        $user = Auth::user();

        // Update PIN langsung via Query Builder untuk memastikan terupdate
        DB::table('users')->where('id', $user->id)->update([
            'pin' => $request->pin,
            'updated_at' => now()
        ]);

        // Kirim notifikasi konfirmasi
        DB::table('notifications')->insert([
            'user_id' => $user->id,
            'title' => 'PIN Keamanan Aktif 🔐',
            'message' => 'PIN transaksi Anda berhasil diatur. Gunakan PIN ini untuk tarik tunai dan transfer.',
            'type' => 'success',
            'is_read' => 0,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $freshUser = User::find($user->id);

        return response()->json([
            'message' => 'PIN berhasil disimpan',
            'user' => $freshUser 
        ]);
    }

    // =========================================================================
    // 8. CHECK USER (Validasi Penerima Transfer)
    // =========================================================================
    public function checkUser(Request $request)
    {
        $request->validate(['phone' => 'required|string']);

        // Cari user berdasarkan nomor HP yang diketik
        $targetUser = User::where('phone', $request->phone)->first();

        if (!$targetUser) {
            return response()->json(['exists' => false, 'message' => 'Nomor HP tidak ditemukan'], 404);
        }

        // Jangan biarkan user mencari nomornya sendiri untuk transfer
        if ($targetUser->id === Auth::id()) {
            return response()->json(['exists' => false, 'message' => 'Tidak bisa mengirim ke nomor sendiri'], 400);
        }

        // Cek apakah anggota sudah diverifikasi admin (status active)
        if ($targetUser->status !== 'active') {
            return response()->json(['exists' => false, 'message' => 'Anggota tujuan belum aktif/diverifikasi'], 403);
        }

        return response()->json([
            'exists' => true,
            'name' => $targetUser->name,
            'id' => $targetUser->id,
            'member_id' => $targetUser->member_id
        ]);
    }
}