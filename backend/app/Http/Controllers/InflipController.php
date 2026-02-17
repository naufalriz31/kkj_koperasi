<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class InflipController extends Controller
{
    /**
     * TAMPILAN ADMIN: List semua proyek
     */
    public function indexAdmin()
    {
        $projects = DB::table('inflip_projects')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($projects);
    }

    /**
     * TAMPILAN USER: List proyek yang statusnya 'open' atau 'closed'
     */
    public function indexUser()
    {
        $projects = DB::table('inflip_projects')
            ->whereIn('status', ['open', 'closed'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($projects);
    }

    /**
     * CREATE: Simpan Proyek Baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'title'           => 'required|string|max:255',
            'location'        => 'required|string',
            'target_amount'   => 'required|numeric',
            'min_investment'  => 'required|numeric',
            'roi_percent'     => 'required|numeric',
            'duration_months' => 'required|integer',
            'image'           => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $imageUrl = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('inflip', 'public');
            $imageUrl = url('/storage/' . $path);
        }

        $id = DB::table('inflip_projects')->insertGetId([
            'title'            => $request->title,
            'description'      => $request->description,
            'location'         => $request->location,
            'target_amount'    => $request->target_amount,
            'collected_amount' => $request->collected_amount ?? 0,
            'min_investment'   => $request->min_investment,
            'roi_percent'      => $request->roi_percent,
            'duration_months'  => $request->duration_months,
            'status'           => $request->status ?? 'open',
            'image_url'        => $imageUrl,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        return response()->json(['message' => 'Proyek berhasil dibuat', 'id' => $id], 201);
    }

    /**
     * UPDATE: Perbarui Data Proyek
     */
    public function update(Request $request, $id)
    {
        $project = DB::table('inflip_projects')->where('id', $id)->first();

        if (!$project) {
            return response()->json(['message' => 'Proyek tidak ditemukan'], 404);
        }

        // Validasi data
        $request->validate([
            'title' => 'required|string',
            'image' => 'nullable|image|max:2048',
        ]);

        $imageUrl = $project->image_url;

        if ($request->hasFile('image')) {
            // Hapus gambar lama
            if ($project->image_url) {
                $oldPath = str_replace(url('/storage/'), '', $project->image_url);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('image')->store('inflip', 'public');
            $imageUrl = url('/storage/' . $path);
        }

        DB::table('inflip_projects')->where('id', $id)->update([
            'title'            => $request->title,
            'description'      => $request->description,
            'location'         => $request->location,
            'target_amount'    => $request->target_amount,
            'collected_amount' => $request->collected_amount,
            'min_investment'   => $request->min_investment,
            'roi_percent'      => $request->roi_percent,
            'duration_months'  => $request->duration_months,
            'status'           => $request->status,
            'image_url'        => $imageUrl,
            'updated_at'       => now(),
        ]);

        return response()->json(['message' => 'Proyek berhasil diperbarui']);
    }

    /**
     * DELETE: Hapus Proyek
     */
    public function destroy($id)
    {
        $project = DB::table('inflip_projects')->where('id', $id)->first();

        if ($project) {
            if ($project->image_url) {
                $path = str_replace(url('/storage/'), '', $project->image_url);
                Storage::disk('public')->delete($path);
            }
            DB::table('inflip_projects')->where('id', $id)->delete();
        }

        return response()->json(['message' => 'Proyek berhasil dihapus']);
    }

    /**
     * USER ACTION: Investasi ke Proyek
     */
    public function invest(Request $request)
    {
        $request->validate([
            'project_id' => 'required|exists:inflip_projects,id',
            'amount'     => 'required|numeric|min:100000',
        ]);

        $user = Auth::user();
        $project = DB::table('inflip_projects')->where('id', $request->project_id)->first();

        if ($project->status !== 'open') {
            return response()->json(['message' => 'Proyek sudah tidak menerima investasi'], 400);
        }

        if ($user->tapro_balance < $request->amount) {
            return response()->json(['message' => 'Saldo Tapro tidak mencukupi'], 400);
        }

        DB::transaction(function () use ($user, $project, $request) {
            // 1. Kurangi Saldo User
            DB::table('users')->where('id', $user->id)->decrement('tapro_balance', $request->amount);

            // 2. Tambah Dana Terkumpul di Proyek
            DB::table('inflip_projects')->where('id', $project->id)->increment('collected_amount', $request->amount);

            // 3. Catat Investasi
            DB::table('inflip_investments')->insert([
                'user_id'    => $user->id,
                'project_id' => $project->id,
                'amount'     => $request->amount,
                'status'     => 'active',
                'created_at' => now(),
            ]);

            // 4. Catat Riwayat Transaksi Global
            DB::table('transactions')->insert([
                'user_id'     => $user->id,
                'type'        => 'withdraw',
                'amount'      => $request->amount,
                'status'      => 'success',
                'description' => "Investasi Properti: {$project->title}",
                'created_at'  => now(),
            ]);
        });

        return response()->json(['message' => 'Investasi berhasil!']);
    }
}