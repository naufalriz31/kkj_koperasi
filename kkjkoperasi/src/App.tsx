import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import { SilaChat } from './components/SilaChat';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// === AUTH PAGES ===
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Welcome } from './pages/Welcome';
import { PendingVerification } from './pages/auth/PendingVerification';

// === MEMBER PAGES ===
import { Home } from './pages/dashboard/Home';
import { Profile } from './pages/dashboard/Profile';
import { Notifications } from './pages/Notifications';

// FINANCING (MEMBER)
import { FinancingMenu } from './pages/financing/Menu';
import { SubmissionForm } from './pages/financing/SubmissionForm';
import { LoanDetail } from './pages/financing/LoanDetail';

// TRANSACTIONS (MEMBER)
import { TransactionMenu } from './pages/transactions/Menu';
import { TopUp } from './pages/transactions/TopUp';
import { TransactionHistory } from './pages/transactions/History';
import { Withdraw } from './pages/transactions/Withdraw';
import { Transfer } from './pages/transactions/Transfer';
import { SetorSimpanan } from './pages/transactions/SetorSimpanan';

// === ADMIN PAGES ===
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminVerification } from './pages/admin/Verification';
import { AdminTransactions } from './pages/admin/Transactions';
import { AdminFinancing } from './pages/admin/Financing';
import { AdminLoanDetail } from './pages/admin/LoanDetailAdmin';
import { AdminFinancialReport } from './pages/admin/FinancialReport';
import AdminKabar from './pages/admin/AdminKabar';
import AdminKabarForm from './pages/admin/AdminKabarForm';
import { AdminTamasa } from './pages/admin/AdminTamasa';
import { AdminInflip } from './pages/admin/AdminInflip';
import { AdminTokoKatalog } from './pages/admin/AdminTokoKatalog';
import { AdminPegadaian } from './pages/admin/AdminPegadaian';
import { AdminLHU } from './pages/admin/AdminLHU';
import { AdminLabaRugi } from './pages/admin/AdminLabaRugi';
import { CreditWarehouse } from './pages/admin/CreditWarehouse'; // Halaman Manajemen Katalog
import { AdminSimpanan } from './pages/admin/AdminSimpanan';

// === PROGRAM & LAINNYA ===
import { Tamasa } from './pages/program/Tamasa';
import { Inflip } from './pages/program/Inflip';
import { Pegadaian } from './pages/program/Pegadaian';
import { UserLHURiwayat } from './pages/lhu/UserLHURiwayat';
import { CheckoutBelanja } from './pages/katalog/CheckoutBelanja';
import { PPOB } from './pages/ppob/PPOB';
import { KabarDetail } from './pages/kabarkkj/KabarDetail';

function App() {
  const { user, checkSession, isLoading } = useAuthStore();

  // Memastikan sesi tetap terjaga saat refresh halaman
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Loading state saat sinkronisasi token di awal aplikasi dimuat
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#136f42]"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat Sesi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container font-sans text-gray-900 bg-gray-50 min-h-screen">
      <BrowserRouter>
        <Toaster 
          position="top-center" 
          reverseOrder={false} 
          toastOptions={{
            style: {
              borderRadius: '1rem',
              fontSize: '14px',
              fontWeight: 'bold',
            }
          }}
        />
        
        {/* Chatbot Sila hanya untuk member yang sudah login */}
        {user && user.role !== 'admin' && <SilaChat />}

        <Routes>
          {/* === PUBLIC ROUTES === */}
          <Route path="/welcome" element={!user ? <Welcome /> : <Navigate to="/" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/pending" element={<PendingVerification />} />

          {/* === ADMIN ROUTES (Hanya untuk Role Admin) === */}
          <Route element={<ProtectedRoute allowedRoles={['admin']}><MainLayout /></ProtectedRoute>}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/verifikasi" element={<AdminVerification />} />
            <Route path="/admin/transaksi" element={<AdminTransactions />} />
            <Route path="/admin/pembiayaan" element={<AdminFinancing />} />
            <Route path="/admin/pembiayaan/:id" element={<AdminLoanDetail />} />
            <Route path="/admin/laporan" element={<AdminFinancialReport />} />
            <Route path="/admin/tamasa" element={<AdminTamasa />} />
            <Route path="/admin/inflip" element={<AdminInflip />} />
            <Route path="/admin/toko" element={<AdminTokoKatalog />} />
            <Route path="/admin/pegadaian" element={<AdminPegadaian />} />
            <Route path="/admin/simpanan" element={<AdminSimpanan />} />
            <Route path="/admin/lhu" element={<AdminLHU />} />
            <Route path="/admin/labarugi" element={<AdminLabaRugi />} />
            <Route path="/admin/kabar" element={<AdminKabar />} />
            <Route path="/admin/kabar/tambah" element={<AdminKabarForm />} />
            <Route path="/admin/kabar/edit/:id" element={<AdminKabarForm />} />
            
            {/* Rute Manajemen Katalog Barang */}
            <Route path="/admin/gudang-kredit" element={<CreditWarehouse />} />
          </Route>

          {/* === MEMBER ROUTES (Protected) === */}
          <Route element={<ProtectedRoute allowedRoles={['member', 'admin']}><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<Home />} />
            <Route path="/profil" element={<Profile />} />
            <Route path="/notifikasi" element={<Notifications />} />

            {/* Transaksi & Wallet */}
            <Route path="/transaksi" element={<TransactionMenu />} />
            <Route path="/transaksi/topup" element={<TopUp />} />
            <Route path="/transaksi/tarik" element={<Withdraw />} />
            <Route path="/transaksi/kirim" element={<Transfer />} />
            <Route path="/transaksi/riwayat" element={<TransactionHistory />} />
            <Route path="/transaksi/setor" element={<SetorSimpanan />} />

            {/* Program Pembiayaan */}
            <Route path="/pembiayaan" element={<FinancingMenu />} />
            <Route path="/pembiayaan/ajukan" element={<SubmissionForm />} />
            <Route path="/pembiayaan/:id" element={<LoanDetail />} />

            {/* Program Unggulan & Layanan Lainnya */}
            <Route path="/program/tamasa" element={<Tamasa />} />
            <Route path="/program/inflip" element={<Inflip />} />
            <Route path="/program/pegadaian" element={<Pegadaian />} />
            <Route path="/lhu/riwayat" element={<UserLHURiwayat />} />
            <Route path="/ppob" element={<PPOB />} />
            <Route path="/belanja/checkout" element={<CheckoutBelanja />} />
            <Route path="/kabar/:id" element={<KabarDetail />} />
          </Route>

          {/* === FALLBACK ROUTES === */}
          <Route path="*" element={<Navigate to={user ? "/" : "/welcome"} replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;