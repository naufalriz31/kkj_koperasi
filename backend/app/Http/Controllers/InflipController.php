<?php

namespace App\Http\Controllers;

use App\Models\User;
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
     * TAMPILAN USER: List proyek yang bisa diinvestasi
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
     * TAMPILAN USER: Ambil Portofolio Investasi Aktif
     * Digunakan agar investasi muncul di tab Portofolio
     */
    public function getPortfolio()
    {
        $user = Auth::user();

        $portfolio = DB::table('inflip_investments')
            ->join('inflip_projects', 'inflip_investments.project_id', '=', 'inflip_projects.id')
            ->where('inflip_investments.user_id', $user->id)
            ->select(
                'inflip_investments.*',
                'inflip_projects.title as project_title',
                'inflip_projects.location',
                'inflip_projects.image_url',
                'inflip_projects.roi_percent',
                'inflip_projects.duration_months',
                'inflip_projects.status as project_status'
            )
            ->orderBy('inflip_investments.created_at', 'desc')
            ->get();

        return response()->json($portfolio);
    }

    /**
     * CREATE: Simpan Proyek Baru (Admin)
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
            'collected_amount' => 0,
            'min_investment'   => $request->min_investment,
            'roi_percent'      => $request->roi_percent,
            'duration_months'  => $request->duration_months,
            'status'           => 'open',
            'image_url'        => $imageUrl,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        return response()->json(['message' => 'Proyek berhasil dibuat', 'id' => $id], 201);
    }

    /**
     * USER ACTION: Investasi ke Proyek
     * Logika ini memotong Tapro dan memasukkan ke portofolio
     */
    public function invest(Request $request)
    {
        $request->validate([
            'project_id' => 'required|exists:inflip_projects,id',
            'amount'     => 'required|numeric|min:100000',
        ]);

        $user = User::find(Auth::id());
        $project = DB::table('inflip_projects')->where('id', $request->project_id)->first();

        if ($project->status !== 'open') {
            return response()->json(['message' => 'Proyek sudah tidak menerima investasi'], 400);
        }

        if ($user->tapro_balance < $request->amount) {
            return response()->json(['message' => 'Saldo Tapro tidak mencukupi'], 400);
        }

        return DB::transaction(function () use ($user, $project, $request) {
            // 1. Kurangi Saldo User
            $user->decrement('tapro_balance', $request->amount);

            // 2. Tambah Dana Terkumpul di Proyek
            DB::table('inflip_projects')->where('id', $project->id)->increment('collected_amount', $request->amount);

            // 3. Catat ke Tabel Investasi (Agar muncul di Portofolio)
            DB::table('inflip_investments')->insert([
                'user_id'    => $user->id,
                'project_id' => $project->id,
                'amount'     => $request->amount,
                'status'     => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 4. Catat Riwayat Transaksi Global (Tabel balance_transactions)
            DB::table('balance_transactions')->insert([
                'user_id'          => $user->id,
                'type'             => 'inflip_invest',
                'amount'           => -$request->amount,
                'status'           => 'success',
                'description'      => "Investasi Properti: {$project->title}",
                'transaction_code' => 'IFP-' . strtoupper(uniqid()),
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            return response()->json([
                'message' => 'Investasi berhasil!',
                'user'    => $user // Kirim data user terbaru untuk update UI
            ]);
        });
    }

    /**
     * DELETE: Hapus Proyek (Admin)
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
}