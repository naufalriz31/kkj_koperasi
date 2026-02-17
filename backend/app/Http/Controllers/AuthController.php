<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // =========================================================================
    // 1. REGISTER
    // =========================================================================
    public function register(Request $request)
    {
        // Validasi input dari frontend (Register.tsx)
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|max:20', // Sesuaikan panjang kolom di DB
            'password' => 'required|string|min:6|confirmed', // butuh field password_confirmation
        ]);

        // Buat user baru
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => 'member',         // Default role
            'status' => 'pending',      // Default status (tunggu admin)
            'tapro_balance' => 0,       // Saldo awal
            'member_id' => 'REG-' . time(), // ID sementara sebelum di-approve admin
        ]);

        // Opsional: Langsung buat token jika ingin auto-login
        // $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil. Silakan login.',
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

        // Cek user & password
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau Password salah'
            ], 401);
        }

        // Cek status akun (Opsional, sudah dihandle di frontend juga)
        if ($user->status === 'rejected') {
            return response()->json(['message' => 'Akun Anda ditolak.'], 403);
        }

        // Hapus token lama agar single session (Opsional)
        // $user->tokens()->delete();

        // Buat token baru
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
        // Hapus token yang sedang dipakai saat ini
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil'
        ]);
    }

    // =========================================================================
    // 4. GET USER PROFILE (Untuk checkSession di App.tsx)
    // =========================================================================
    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    // =========================================================================
    // 5. UPDATE PROFILE (Nama & HP)
    // =========================================================================
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
        ]);

        $user = $request->user();
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
    // 6. UPDATE AVATAR (Foto Profil)
    // =========================================================================
    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $request->user();

        // Hapus foto lama jika ada
        if ($user->avatar_url) {
            // Ambil path relatif dari URL (logic tergantung setting storage Anda)
            // Contoh sederhana:
            $oldPath = str_replace(url('/storage/'), '', $user->avatar_url);
            Storage::disk('public')->delete($oldPath);
        }

        // Simpan foto baru
        $path = $request->file('avatar')->store('avatars', 'public');
        
        // Simpan URL lengkap ke database
        $url = url('/storage/' . $path);
        
        $user->update(['avatar_url' => $url]);

        return response()->json([
            'message' => 'Foto profil berhasil diunggah',
            'avatar_url' => $url
        ]);
    }

    // =========================================================================
    // 7. DELETE AVATAR
    // =========================================================================
    public function deleteAvatar(Request $request)
    {
        $user = $request->user();

        if ($user->avatar_url) {
            $oldPath = str_replace(url('/storage/'), '', $user->avatar_url);
            Storage::disk('public')->delete($oldPath);
        }

        $user->update(['avatar_url' => null]);

        return response()->json(['message' => 'Foto profil dihapus']);
    }

    // =========================================================================
    // 8. UPDATE PIN (Untuk Transaksi)
    // =========================================================================
    public function updatePin(Request $request)
    {
        $request->validate([
            'pin' => 'required|string|size:6', // PIN harus 6 digit angka
            'current_pin' => 'nullable|string'
        ]);

        $user = $request->user();

        // Jika user sudah punya PIN, validasi PIN lama
        if ($user->pin && $request->current_pin !== $user->pin) {
            return response()->json(['message' => 'PIN Lama salah'], 400);
        }

        $user->update(['pin' => $request->pin]);

        return response()->json(['message' => 'PIN berhasil disimpan']);
    }

    // =========================================================================
    // 9. CHECK USER (Untuk Fitur Transfer)
    // =========================================================================
    public function checkUser(Request $request)
    {
        $request->validate([
            'phone' => 'required|string'
        ]);

        // Cari user lain berdasarkan No HP (selain diri sendiri)
        $targetUser = User::where('phone', $request->phone)
                          ->where('id', '!=', $request->user()->id)
                          ->first();

        if ($targetUser) {
            return response()->json([
                'exists' => true,
                'name' => $targetUser->name,
                'id' => $targetUser->id
            ]);
        }

        return response()->json(['exists' => false, 'message' => 'User tidak ditemukan'], 404);
    }
}