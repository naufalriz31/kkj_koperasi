<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class KabarController extends Controller
{
    /**
     * Menampilkan semua daftar kabar untuk Admin
     */
    public function index()
    {
        $kabar = DB::table('kabar_kkj')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($kabar);
    }

    /**
     * Mengambil detail satu kabar (untuk Edit Form)
     */
    public function show($id)
    {
        $kabar = DB::table('kabar_kkj')->where('id', $id)->first();

        if (!$kabar) {
            return response()->json(['message' => 'Kabar tidak ditemukan'], 404);
        }

        return response()->json($kabar);
    }

    /**
     * Menyimpan Kabar Baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'type'        => 'required|in:PROMO,INFO,RAT,PROGRAM',
            'color'       => 'required|string',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $imageUrl = null;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('kabar', 'public');
            $imageUrl = url('/storage/' . $path);
        }

        $id = DB::table('kabar_kkj')->insertGetId([
            'title'       => $request->title,
            'description' => $request->description,
            'type'        => $request->type,
            'color'       => $request->color,
            'is_active'   => $request->is_active === '1' || $request->is_active === true,
            'image_url'   => $imageUrl,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        return response()->json(['message' => 'Kabar berhasil dibuat', 'id' => $id], 201);
    }

    /**
     * Memperbarui Kabar (Menggunakan POST dengan _method PUT dari Frontend)
     */
    public function update(Request $request, $id)
    {
        $kabar = DB::table('kabar_kkj')->where('id', $id)->first();

        if (!$kabar) {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }

        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'type'        => 'required|in:PROMO,INFO,RAT,PROGRAM',
            'color'       => 'required|string',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $imageUrl = $kabar->image_url;

        // Jika ada upload gambar baru
        if ($request->hasFile('image')) {
            // Hapus gambar lama jika ada
            if ($kabar->image_url) {
                $oldPath = str_replace(url('/storage/'), '', $kabar->image_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('image')->store('kabar', 'public');
            $imageUrl = url('/storage/' . $path);
        }

        DB::table('kabar_kkj')->where('id', $id)->update([
            'title'       => $request->title,
            'description' => $request->description,
            'type'        => $request->type,
            'color'       => $request->color,
            'is_active'   => $request->is_active === '1' || $request->is_active === true,
            'image_url'   => $imageUrl,
            'updated_at'  => now(),
        ]);

        return response()->json(['message' => 'Kabar berhasil diperbarui']);
    }

    /**
     * Toggle status aktif secara cepat
     */
    public function toggleActive(Request $request, $id)
    {
        DB::table('kabar_kkj')->where('id', $id)->update([
            'is_active' => $request->is_active,
            'updated_at' => now()
        ]);

        return response()->json(['message' => 'Status berhasil diubah']);
    }

    /**
     * Menghapus Kabar
     */
    public function destroy($id)
    {
        $kabar = DB::table('kabar_kkj')->where('id', $id)->first();

        if ($kabar) {
            // Hapus gambar dari storage
            if ($kabar->image_url) {
                $path = str_replace(url('/storage/'), '', $kabar->image_url);
                Storage::disk('public')->delete($path);
            }

            DB::table('kabar_kkj')->where('id', $id)->delete();
        }

        return response()->json(['message' => 'Kabar berhasil dihapus']);
    }
}