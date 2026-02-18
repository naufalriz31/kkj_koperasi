import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/api'; // Menggunakan Axios
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Calculator, ShoppingBag, Briefcase, BookOpen, GraduationCap, Info, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '../../lib/utils';

export const SubmissionForm = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    // Tipe Pembiayaan
    const [type, setType] = useState('Kredit Barang');

    // --- STATE KATALOG (DATA DARI LARAVEL) ---
    const [catalogItems, setCatalogItems] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    // Fetch Data Katalog saat komponen dimuat
    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                // Endpoint Laravel: GET /shop/products (disesuaikan agar sinkron dengan credit_catalog)
                const response = await API.get('/shop/products');
                setCatalogItems(response.data || []);
            } catch (error) {
                console.error("Error fetching catalog:", error);
                toast.error("Gagal memuat katalog barang");
            }
        };

        fetchCatalog();
    }, []);

    // State Dinamis
    const [formData, setFormData] = useState({
        jenisUsaha: '', namaUsaha: '', lamaUsaha: '', omsetHarian: '', keuntunganBersih: '', besarModal: '',
        jenisPelatihan: '', namaPelatihan: '', biayaPelatihan: '',
        namaAnak: '', namaSekolah: '', biayaPendidikan: '',
        peruntukan: '',
        tenor: '12' // Default
    });

    // Hasil Perhitungan
    const [simulation, setSimulation] = useState({
        pokok: 0, margin: 0, angsuran: 0, pajak: 0
    });

    // --- LOGIC PERHITUNGAN SIMULASI ---
    useEffect(() => {
        let pokok = 0;
        let pajak = 0;
        let ratePerBulan = 0;
        let tenor = parseInt(formData.tenor) || 0;

        if (type === 'Kredit Barang') {
            if (selectedProduct) {
                pokok = (selectedProduct.price - selectedProduct.dp);
                pajak = selectedProduct.tax || 0;
                
                // Pastikan tenor yang dipilih valid sesuai list produk
                if (Array.isArray(selectedProduct.tenors)) {
                    if (!selectedProduct.tenors.map(String).includes(formData.tenor)) {
                        tenor = parseInt(selectedProduct.tenors[0]);
                    }
                }
            }
        } else if (type === 'Modal Usaha') {
            pokok = parseInt(formData.besarModal.replace(/\D/g, '')) || 0;
        } else if (type === 'Biaya Pelatihan') {
            pokok = parseInt(formData.biayaPelatihan.replace(/\D/g, '')) || 0;
        } else if (type === 'Biaya Pendidikan') {
            pokok = parseInt(formData.biayaPendidikan.replace(/\D/g, '')) || 0;
        }

        // Tentukan Rumus Jasa
        if (type === 'Kredit Barang' || type === 'Modal Usaha') {
            ratePerBulan = (0.10 / 12);
        } else {
            ratePerBulan = 0.006;
        }

        if (pokok > 0 && tenor > 0) {
            const totalPokok = pokok + pajak;
            const totalJasa = Math.round(pokok * ratePerBulan * tenor); 
            const totalBayar = totalPokok + totalJasa;
            const angsuranPerBulan = totalBayar / tenor;

            setSimulation({
                pokok: pokok,
                margin: totalJasa,
                pajak: pajak,
                angsuran: Math.ceil(angsuranPerBulan)
            });
        } else {
            setSimulation({ pokok: 0, margin: 0, angsuran: 0, pajak: 0 });
        }

    }, [formData, type, selectedProduct]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const productId = parseInt(e.target.value);
        const product = catalogItems.find(item => item.id === productId);
        
        if (product) {
            // [PENTING] Buat salinan aman dan parsing tenor dari String ke Array
            const safeProduct = { ...product };
            if (typeof safeProduct.tenors === 'string') {
                try {
                    safeProduct.tenors = JSON.parse(safeProduct.tenors);
                } catch (err) {
                    safeProduct.tenors = [12];
                }
            }
            
            setSelectedProduct(safeProduct);

            // Set tenor pertama otomatis agar simulasi langsung menghitung
            if (Array.isArray(safeProduct.tenors) && safeProduct.tenors.length > 0) {
                setFormData(prev => ({ ...prev, tenor: safeProduct.tenors[0].toString() }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (simulation.pokok < 100000) return toast.error('Nominal pembiayaan tidak valid.');

        setIsLoading(true);
        const toastId = toast.loading('Mengirim pengajuan...');

        try {
            let detailData = {};
            if (type === 'Kredit Barang') {
                if (!selectedProduct) throw new Error("Pilih barang terlebih dahulu");
                detailData = {
                    item_id: selectedProduct.id,
                    item_name: selectedProduct.name,
                    price: selectedProduct.price,
                    dp: selectedProduct.dp,
                    tax: selectedProduct.tax
                };
            } else {
                detailData = formData;
            }

            await API.post('/financing/apply', {
                type: type,
                amount: simulation.pokok + simulation.pajak, 
                duration: parseInt(formData.tenor),
                monthly_payment: simulation.angsuran,
                details: detailData
            });

            toast.success('Pengajuan berhasil!', { id: toastId });
            navigate('/pembiayaan');
        } catch (error: any) {
            toast.error('Gagal: ' + (error.response?.data?.message || 'Terjadi kesalahan'), { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const renderFormInputs = () => {
        switch (type) {
            case 'Kredit Barang':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-green-50 p-3 rounded-lg flex gap-2 text-sm text-green-800 border border-green-200">
                            <Info className="shrink-0 mt-0.5" size={16} />
                            <p>Pilih barang yang tersedia di katalog. DP dan Tenor sudah ditentukan oleh Admin.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Barang</label>
                            <select
                                className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#136f42] outline-none"
                                onChange={handleProductChange}
                                defaultValue=""
                            >
                                <option value="" disabled>-- Pilih Katalog Barang --</option>
                                {catalogItems.map(item => (
                                    <option key={item.id} value={item.id}>{item.name} - {formatRupiah(item.price)}</option>
                                ))}
                            </select>
                        </div>
                        {selectedProduct && (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Harga Barang</span>
                                    <span className="font-bold text-gray-800">{formatRupiah(selectedProduct.price)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Wajib DP</span>
                                    <span className="font-bold text-green-600">{formatRupiah(selectedProduct.dp)}</span>
                                </div>
                                <div className="border-t border-dashed border-gray-300 pt-2 flex justify-between text-sm font-bold">
                                    <span>Sisa Pokok Hutang</span>
                                    <span className="text-[#136f42]">{formatRupiah((selectedProduct.price - selectedProduct.dp) + (selectedProduct.tax || 0))}</span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'Modal Usaha':
                return (
                    <>
                        <Input name="jenisUsaha" label="Jenis Usaha" onChange={handleChange} required />
                        <Input name="namaUsaha" label="Nama Usaha" onChange={handleChange} required />
                        <Input name="besarModal" label="Besar Modal (Rp)" type="number" onChange={handleChange} required />
                        <Input name="peruntukan" label="Peruntukan" onChange={handleChange} required />
                    </>
                );
            case 'Biaya Pelatihan':
                return (
                    <>
                        <Input name="namaPelatihan" label="Nama Pelatihan" onChange={handleChange} required />
                        <Input name="biayaPelatihan" label="Biaya (Rp)" type="number" onChange={handleChange} required />
                    </>
                );
            case 'Biaya Pendidikan':
                return (
                    <>
                        <Input name="namaAnak" label="Nama Anak" onChange={handleChange} required />
                        <Input name="biayaPendidikan" label="Biaya (Rp)" type="number" onChange={handleChange} required />
                    </>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            <div className="bg-white border-b border-green-100 sticky top-0 z-30 px-4 py-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-green-50 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-[#136f42]" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Formulir Pembiayaan</h1>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Kredit Barang', 'Modal Usaha', 'Biaya Pelatihan', 'Biaya Pendidikan'].map((id) => (
                        <button
                            key={id}
                            onClick={() => { setType(id); setSelectedProduct(null); setSimulation({ pokok: 0, margin: 0, angsuran: 0, pajak: 0 }); }}
                            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${type === id ? 'bg-[#136f42] text-white border-[#136f42] shadow-lg scale-105' : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50 hover:border-green-200'}`}
                        >
                            {id}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4 h-fit">
                        <h2 className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-2">{type}</h2>
                        {renderFormInputs()}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tenor (Bulan)</label>
                            <div className="grid grid-cols-4 gap-2">
                                {(Array.isArray(selectedProduct?.tenors) 
                                    ? selectedProduct.tenors 
                                    : [3, 6, 12, 24]).map((bln: any) => (
                                    <button
                                        key={bln}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tenor: bln.toString() })}
                                        className={`py-2 rounded-lg border text-sm font-bold transition-all ${formData.tenor === bln.toString() ? 'bg-[#aeea00] text-[#0f5c35] border-[#aeea00] shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50'}`}
                                    >
                                        {bln}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </form>

                    <div className="space-y-4">
                        <div className="bg-[#136f42] text-white p-6 rounded-2xl shadow-xl">
                            <h3 className="font-bold text-[#aeea00] flex items-center gap-2 mb-4"><Calculator size={18} /> Simulasi Angsuran</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="opacity-70">Pokok</span><span className="font-bold">{formatRupiah(simulation.pokok)}</span></div>
                                <div className="flex justify-between"><span className="opacity-70">Jasa</span><span className="font-bold text-[#aeea00]">+ {formatRupiah(simulation.margin)}</span></div>
                                <div className="h-px bg-white/20 my-2"></div>
                                <div className="flex justify-between items-center text-lg"><span className="font-bold">Angsuran / Bulan</span><span className="font-bold text-[#aeea00]">{formatRupiah(simulation.angsuran)}</span></div>
                                <div className="text-right text-[10px] opacity-60 font-bold">x {formData.tenor} Bulan</div>
                            </div>
                        </div>
                        <Button onClick={handleSubmit} isLoading={isLoading} disabled={simulation.pokok === 0 || (type === 'Kredit Barang' && !selectedProduct)} className="w-full bg-[#136f42] hover:bg-[#0f5c35] py-4 rounded-xl shadow-lg font-bold">Ajukan Sekarang</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};