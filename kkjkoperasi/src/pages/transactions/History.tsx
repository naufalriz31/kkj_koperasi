import React, { useEffect, useState } from 'react';
import API from '../../api/api'; 
import { useAuthStore } from '../../store/useAuthStore';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ArrowRightLeft,
  Coins,
  TrendingUp,
  Filter,
  PiggyBank,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRupiah, cn } from '../../lib/utils';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';

export const TransactionHistory = () => {
  const { user, checkSession } = useAuthStore();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        if (!user) {
          await checkSession();
        }

        // [FIX]: Menggunakan endpoint yang konsisten dengan controller backend
        const response = await API.get('/balance/history');
        setTransactions(response.data || []);
      } catch (error) {
        console.error("Gagal mengambil riwayat:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [checkSession]); // user dihilangkan dari dependency agar tidak infinite loop jika checkSession update user

  const getTransactionStyle = (tx: any) => {
    const type = tx.type;
    const displayLabel = tx.description || '';

    switch (type) {
      case 'topup':
        return {
          icon: <ArrowDownLeft size={20} />,
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          label: displayLabel || 'Isi Saldo'
        };
      case 'withdraw':
        return {
          icon: <ArrowUpRight size={20} />,
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          label: displayLabel || 'Tarik Tunai'
        };
      case 'transfer':
        // Jika amount negatif berarti transfer keluar, jika positif transfer masuk
        const isOut = tx.amount < 0;
        return {
          icon: isOut ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />,
          bg: isOut ? 'bg-rose-50' : 'bg-emerald-50',
          text: isOut ? 'text-rose-700' : 'text-emerald-700',
          label: displayLabel || (isOut ? 'Transfer Keluar' : 'Transfer Masuk')
        };
      case 'transfer_internal':
        return {
          icon: <PiggyBank size={20} />,
          bg: 'bg-indigo-50',
          text: 'text-indigo-700',
          label: displayLabel || 'Setor Simpanan'
        };
      case 'tamasa_buy':
        return {
          icon: <Coins size={20} />,
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          label: displayLabel || 'Beli Emas Tamasa'
        };
      case 'lhu':
        return {
          icon: <TrendingUp size={20} />,
          bg: 'bg-green-50',
          text: 'text-green-700',
          label: displayLabel || 'Bagi Hasil LHU'
        };
      default:
        return {
          icon: <ArrowRightLeft size={20} />,
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          label: displayLabel || type
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-slate-900">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b border-green-100 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-green-50 transition text-[#136f42]"
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
            <h1 className="text-lg font-bold text-gray-900">
              Riwayat Transaksi
            </h1>
          </div>
          <button className="p-2 text-slate-400 hover:text-[#136f42] transition">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-24 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-[#136f42]" size={32} />
            <p className="text-sm text-slate-500 font-medium">
              Memuat data...
            </p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center text-slate-400">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 border border-gray-100">
              <Clock size={32} className="text-[#136f42]/30" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">
              Belum ada transaksi
            </p>
          </div>
        ) : (
          transactions.map((tx) => {
            const style = getTransactionStyle(tx);
            // Saldo masuk jika type topup, transfer masuk, atau nominal positif
            const isIncome = tx.amount > 0;

            return (
              <div
                key={tx.id}
                className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm hover:shadow-md transition group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-sm",
                      style.bg,
                      style.text
                    )}
                  >
                    {style.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm leading-tight tracking-tight truncate">
                      {style.label}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                      {format(
                        new Date(tx.created_at),
                        'dd MMM yyyy, HH:mm',
                        { locale: indonesia }
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "font-mono font-black text-base tracking-tighter",
                      isIncome ? 'text-emerald-600' : 'text-slate-900'
                    )}
                  >
                    {isIncome ? '+' : '-'} {formatRupiah(Math.abs(tx.amount))}
                  </p>

                  <div className="flex justify-end mt-1">
                    <span className={cn(
                        "flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg border shadow-sm",
                        tx.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                        tx.status === 'success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        "bg-rose-50 text-rose-700 border-rose-100"
                    )}>
                        {tx.status === 'success' ? 'Berhasil' : tx.status === 'pending' ? 'Proses' : 'Gagal'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Tombol bantuan atau info tambahan */}
      <div className="max-w-xl mx-auto px-4 mt-4">
        <p className="text-center text-[10px] text-slate-400 font-medium leading-relaxed">
          Menampilkan riwayat transaksi 30 hari terakhir. <br />
          Hubungi admin jika terdapat selisih saldo.
        </p>
      </div>
    </div>
  );
};