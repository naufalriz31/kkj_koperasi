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
     * Menampilkan daftar kabar yang aktif untuk Dashboard Anggota/Home
     */
    public function indexActive()
    {
        $kabar = DB::table('kabar_kkj')
            ->where('is_active', 1)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($kabar);
    }

    /**
     * Mengambil detail satu kabar (Untuk Edit atau Baca)
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
        // Validasi input dari Frontend
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string', // Frontend mengirim dengan nama 'description'
            'type'        => 'required|string', // Frontend mengirim dengan nama 'type'
            'image'       => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        // 1. Ambil ID Admin yang sedang login (Solusi Error 'author_id')
        $authorId = auth()->id(); 
        
        // Jika tidak ada user login (misal testing tanpa auth), set default ke 1 atau null (hati-hati)
        if (!$authorId) {
             // Opsional: Batalkan jika wajib login, atau set dummy ID jika DB mengizinkan
             // return response()->json(['message' => 'Unauthorized'], 401);
             $authorId = 1; // Fallback sementara jika auth bermasalah
        }

        // 2. Handle Upload Gambar
        $imageUrl = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('kabar', 'public');
            $imageUrl = url('/storage/' . $path);
        }

        // 3. Generate Slug Otomatis (Solusi Error 'slug')
        $slug = Str::slug($request->title) . '-' . time();

        // 4. Simpan ke Database
        // Mapping: description -> content, type -> category
        $kabarId = DB::table('kabar_kkj')->insertGetId([
            'title'      => $request->title,
            'slug'       => $slug,
            'content'    => $request->description, // Masuk ke kolom 'content'
            'category'   => $request->type,        // Masuk ke kolom 'category'
            'image_url'  => $imageUrl,
            'author_id'  => $authorId,
            'is_active'  => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Kabar berhasil ditambahkan', 
            'id' => $kabarId
        ]);
    }

    /**
     * Memperbarui Kabar
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
            'type'        => 'required|string',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $imageUrl = $kabar->image_url;

        // Cek jika ada gambar baru yang diupload
        if ($request->hasFile('image')) {
            // Hapus gambar lama jika ada
            if ($kabar->image_url) {
                $oldPath = str_replace(url('/storage/'), '', $kabar->image_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('image')->store('kabar', 'public');
            $imageUrl = url('/storage/' . $path);
        }

        // Update Database
        DB::table('kabar_kkj')->where('id', $id)->update([
            'title'      => $request->title,
            'slug'       => Str::slug($request->title) . '-' . $id,
            'content'    => $request->description,
            'category'   => $request->type,
            'image_url'  => $imageUrl,
            // Handle boolean atau string '1'/'0' dari frontend
            'is_active'  => filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Kabar berhasil diperbarui']);
    }

    /**
     * Menghapus Kabar
     */
    public function destroy($id)
    {
        $kabar = DB::table('kabar_kkj')->where('id', $id)->first();

        if ($kabar) {
            // Hapus file gambar fisik
            if ($kabar->image_url) {
                $path = str_replace(url('/storage/'), '', $kabar->image_url);
                Storage::disk('public')->delete($path);
            }
            // Hapus data di DB
            DB::table('kabar_kkj')->where('id', $id)->delete();
        }

        return response()->json(['message' => 'Kabar berhasil dihapus']);
    }
}