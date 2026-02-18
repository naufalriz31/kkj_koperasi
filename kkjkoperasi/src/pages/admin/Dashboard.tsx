import React, { useEffect, useState } from 'react';
import {
    Users, ChevronRight, LogOut, ShieldCheck,
    ArrowRightLeft, PieChart, AlertTriangle, Scale,
    ShoppingBag, TrendingUp, Receipt, Banknote, Building, Wallet,
    Loader2, Newspaper, Archive
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/api'; 
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../lib/utils';

export const AdminDashboard = () => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        pendingUsers: 0, pendingTx: 0, pendingLoans: 0,
        pendingRestructures: 0, pendingTamasa: 0, pendingPawn: 0,
        pendingOrders: 0, pendingLHU: 0, activeInflip: 0,
        pendingWithdrawals: 0, 
    });

    const fetchStats = async () => {
        try {
            const response = await API.get('/admin/stats');
            const data = response.data;
            setStats({
                pendingUsers: data.pending_users_count || 0,
                pendingTx: data.pending_transactions_count || 0,
                pendingLoans: data.pending_loans_count || 0,
                pendingRestructures: data.pending_restructures_count || 0,
                pendingTamasa: data.pending_tamasa_count || 0,
                pendingPawn: data.pending_pawn_count || 0,
                pendingOrders: data.pending_orders_count || 0,
                pendingLHU: data.pending_lhu_count || 0,
                activeInflip: data.active_inflip_count || 0,
                pendingWithdrawals: data.pending_withdrawals_count || 0,
            });
        } catch (error) {
            console.error("Gagal statistik:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); 
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        if (window.confirm("Keluar dari panel admin?")) {
            logout();
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans">
            
            {/* HEADER ADMIN (KKJ CONTROL CENTER) */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-50 px-6 py-4 shadow-sm">
                <div className="max-w-[1400px] mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <h1 className="font-black text-slate-800 tracking-tighter text-xl uppercase leading-none">
                            KKJ <span className="text-[#136f42]">CONTROL CENTER</span>
                        </h1>
                        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Admin Panel</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                            <div className="w-2 h-2 rounded-full bg-[#aeea00] animate-pulse" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Active</span>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 pt-8 space-y-8">
                
                {/* HERO SECTION */}
                <div className="relative bg-[#136f42] rounded-[2.5rem] p-10 md:p-14 overflow-hidden shadow-2xl shadow-green-900/20">
                    <div className="absolute right-0 top-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="space-y-3">
                            <h1 className="text-5xl md:text-6xl font-[1000] text-white tracking-tighter uppercase leading-none">
                                HALO, ADMIN
                            </h1>
                            <p className="text-green-100/70 text-sm font-bold uppercase tracking-[0.3em]">Master Administrator Panel</p>
                        </div>
                        <Link to="/admin/labarugi" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 border border-white/10 backdrop-blur-sm">
                            <PieChart size={18} /> Keuangan Real-time
                        </Link>
                    </div>
                </div>

                {/* NOTIFIKASI TINDAKAN (ACTION CENTER) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.pendingRestructures > 0 && (
                        <AlertCard 
                            to="/admin/pembiayaan" 
                            title={`${stats.pendingRestructures} REQUEST TENOR`} 
                            type="danger" 
                            icon={<AlertTriangle size={16} />} 
                        />
                    )}
                    {stats.pendingUsers > 0 && (
                        <AlertCard 
                            to="/admin/verifikasi" 
                            title={`${stats.pendingUsers} VERIFIKASI ANGGOTA`} 
                            type="warning" 
                            icon={<Users size={16} />} 
                        />
                    )}
                    {stats.pendingLHU > 0 && (
                        <AlertCard 
                            to="/admin/lhu" 
                            title={`${stats.pendingLHU} EKSEKUSI LHU`} 
                            type="info" 
                            icon={<TrendingUp size={16} />} 
                        />
                    )}
                </div>

                {/* LAYANAN UTAMA */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-3 border-l-4 border-[#136f42] pl-4">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Layanan Utama</h2>
                        {loading && <Loader2 className="animate-spin text-[#136f42]" size={14} />}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        <DashboardCard to="/admin/verifikasi" icon={<Users size={28} />} title="Anggota" color="green" count={stats.pendingUsers} />
                        <DashboardCard to="/admin/transaksi" icon={<ArrowRightLeft size={28} />} title="Finance" color="emerald" count={stats.pendingTx} />
                        <DashboardCard to="/admin/simpanan" icon={<Wallet size={28} />} title="Tarik Simpanan" color="rose" count={stats.pendingWithdrawals} />
                        <DashboardCard to="/admin/tamasa" icon={<ShieldCheck size={28} />} title="Tamasa" color="amber" count={stats.pendingTamasa} />
                        <DashboardCard to="/admin/pegadaian" icon={<Scale size={28} />} title="Gadai" color="blue" count={stats.pendingPawn} />
                        <DashboardCard to="/admin/pembiayaan" icon={<Banknote size={28} />} title="Pinjaman" color="rose" count={stats.pendingLoans} />
                        <DashboardCard to="/admin/inflip" icon={<Building size={28} />} title="Properti (INFLIP)" color="sky" count={stats.activeInflip} />
                        <DashboardCard to="/admin/toko" icon={<ShoppingBag size={28} />} title="Toko" color="violet" count={stats.pendingOrders} />
                        <DashboardCard to="/admin/lhu" icon={<TrendingUp size={28} />} title="LHU" color="teal" count={stats.pendingLHU} />
                        <DashboardCard to="/admin/kabar" icon={<Newspaper size={28} />} title="Kabar KKJ" color="blue" count={0} />

                        {/* MENU GUDANG KREDIT (KATALOG BARANG) */}
                        <DashboardCard to="/admin/gudang-kredit" icon={<Archive size={28} />} title="Gudang Kredit" color="slate" count={0} />
                        
                        <DashboardCard to="/admin/labarugi" icon={<Receipt size={28} />} title="Laba Rugi" color="slate" count={0} />
                    </div>
                </div>
            </div>
        </div>
    );
};

/* --- SUB-COMPONENTS --- */

const DashboardCard = ({ to, icon, title, color, count }: any) => {
    const styles: any = {
        green: "bg-green-50 text-[#136f42]",
        emerald: "bg-emerald-50 text-emerald-600",
        rose: "bg-rose-50 text-rose-600",
        amber: "bg-amber-50 text-amber-600",
        blue: "bg-blue-50 text-blue-600",
        violet: "bg-violet-50 text-violet-600",
        teal: "bg-teal-50 text-teal-600",
        slate: "bg-slate-50 text-slate-600",
        sky: "bg-sky-50 text-sky-600",
    };

    return (
        <Link to={to} className="group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.03)] hover:shadow-2xl hover:shadow-[#136f42]/10 transition-all duration-500 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden h-[180px] hover:-translate-y-2">
            {count > 0 && (
                <div className="absolute top-6 right-6 w-6 h-6 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full animate-pulse border-2 border-white shadow-lg shadow-rose-500/30">
                    {count}
                </div>
            )}
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-700 group-hover:scale-110", styles[color] || styles.slate)}>
                {icon}
            </div>
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-[#136f42] transition-colors">
                {title}
            </h3>
        </Link>
    );
};

const AlertCard = ({ to, title, type, icon }: any) => (
    <Link to={to} className={cn(
        "px-6 py-5 rounded-2xl flex items-center justify-between group transition-all shadow-sm border border-transparent hover:scale-[1.02] active:scale-95",
        type === 'danger' ? "bg-rose-50 text-rose-700" : 
        type === 'warning' ? "bg-amber-50 text-amber-700" : 
        "bg-green-50 text-[#136f42]"
    )}>
        <div className="flex items-center gap-4">
            <div className="bg-white p-2.5 rounded-xl shadow-sm text-inherit">
                {icon}
            </div>
            <h4 className="text-[11px] font-black uppercase tracking-widest">{title}</h4>
        </div>
        <ChevronRight size={18} className="opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </Link>
);