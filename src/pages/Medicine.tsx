import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, PackagePlus, Pill, AlertTriangle, PackageOpen, CalendarClock, SlidersHorizontal, Loader2, Filter, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { StatsCard } from '../components/StatsCard';
import { PermissionGuard } from '../components/PermissionGuard';

interface Medicine { _id: string; name: string; genericName: string; category: string; manufacturer: string; batchNumber: string; expiryDate: string; mrp: number; sellingPrice: number; currentStock: number; minimumStock: number; unit: string; isActive: boolean; }
interface Stats { total: number; lowStock: number; outOfStock: number; expiringSoon: number; }

const CATEGORIES = ['tablet', 'capsule', 'syrup', 'injection', 'drops', 'cream', 'powder', 'other'];
const empty = { name: '', genericName: '', category: 'tablet', manufacturer: '', batchNumber: '', expiryDate: '', mrp: '', purchasePrice: '', sellingPrice: '', currentStock: '', minimumStock: '10', unit: 'strip', taxPercent: '0' };

const categoryColors: Record<string, string> = {
  tablet: 'bg-blue-50 text-blue-700', capsule: 'bg-purple-50 text-purple-700', syrup: 'bg-teal-50 text-teal-700',
  injection: 'bg-red-50 text-red-700', drops: 'bg-cyan-50 text-cyan-700', cream: 'bg-pink-50 text-pink-700',
  powder: 'bg-amber-50 text-amber-700', other: 'bg-slate-100 text-slate-600',
};

export function Medicine() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [modal, setModal] = useState(false);
  const [stockModal, setStockModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [editId, setEditId] = useState<string | null>(null);
  const [stockAdj, setStockAdj] = useState({ quantity: '', type: 'add' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, sRes] = await Promise.all([
        api.get('/medicine', { params: { search, category, lowStock: lowStock ? 'true' : undefined, page, limit: 20 } }),
        api.get('/medicine/stats'),
      ]);
      setMedicines(mRes.data.data.medicines);
      setTotal(mRes.data.data.total || 0);
      setStats(sRes.data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, category, lowStock, page]);

  const openCreate = () => { setForm({ ...empty }); setEditId(null); setModal(true); };
  const openEdit = (m: Medicine) => {
    setForm({ name: m.name, genericName: m.genericName || '', category: m.category, manufacturer: m.manufacturer || '', batchNumber: m.batchNumber || '', expiryDate: m.expiryDate ? m.expiryDate.split('T')[0] : '', mrp: String(m.mrp), purchasePrice: '', sellingPrice: String(m.sellingPrice), currentStock: String(m.currentStock), minimumStock: String(m.minimumStock), unit: m.unit, taxPercent: '0' });
    setEditId(m._id);
    setModal(true);
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, mrp: Number(form.mrp), purchasePrice: Number(form.purchasePrice), sellingPrice: Number(form.sellingPrice), currentStock: Number(form.currentStock), minimumStock: Number(form.minimumStock) };
      if (editId) await api.put(`/medicine/${editId}`, payload);
      else await api.post('/medicine', payload);
      setModal(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleStockAdj = async () => {
    if (!selectedMed || !stockAdj.quantity) return;
    setSaving(true);
    try {
      await api.post(`/medicine/${selectedMed._id}/stock`, { quantity: Number(stockAdj.quantity), type: stockAdj.type });
      setStockModal(false);
      load();
    } finally { setSaving(false); }
  };

  const stockBadge = (m: Medicine) => {
    if (m.currentStock === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><PackageOpen size={10} /> Out of Stock</span>;
    if (m.currentStock <= m.minimumStock) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200"><AlertTriangle size={10} /> Low Stock</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">In Stock</span>;
  };

  const f = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicine Stock</h1>
          <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
            <Pill size={13} /> Inventory management
          </p>
        </div>
        <PermissionGuard module="medicine_stock" action="create">
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors">
            <Plus size={16} /> Add Medicine
          </button>
        </PermissionGuard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Medicines" value={stats?.total ?? 0}       icon={Pill}         color="blue"   />
        <StatsCard title="Low Stock"       value={stats?.lowStock ?? 0}    icon={AlertTriangle} color="orange" />
        <StatsCard title="Out of Stock"    value={stats?.outOfStock ?? 0}  icon={PackageOpen}  color="red"    />
        <StatsCard title="Expiring Soon"   value={stats?.expiringSoon ?? 0} icon={CalendarClock} color="purple" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4 flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search medicines…"
            className="border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors" />
        </div>
        <div className="relative">
          <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl pl-8 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 appearance-none">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
        <button onClick={() => { setLowStock(v => !v); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${lowStock ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600'}`}>
          <Filter size={14} /> Low Stock Only
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Medicine', 'Generic', 'Category', 'Price', 'Stock', 'Status', 'Expiry', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center">
                <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
              </td></tr>
            ) : medicines.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-slate-400">
                <Pill size={32} className="mx-auto mb-2 opacity-30" />No medicines found
              </td></tr>
            ) : medicines.map(m => (
              <tr key={m._id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-slate-800 text-sm">{m.name}</p>
                  {m.manufacturer && <p className="text-xs text-slate-400">{m.manufacturer}</p>}
                </td>
                <td className="px-4 py-3.5 text-slate-500 text-xs">{m.genericName || <span className="text-slate-300">—</span>}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg ${categoryColors[m.category] ?? 'bg-slate-100 text-slate-600'}`}>{m.category}</span>
                </td>
                <td className="px-4 py-3.5 font-bold text-slate-800">₹{m.sellingPrice}</td>
                <td className="px-4 py-3.5">
                  <span className={`font-semibold ${m.currentStock === 0 ? 'text-red-600' : m.currentStock <= m.minimumStock ? 'text-orange-600' : 'text-slate-700'}`}>
                    {m.currentStock} {m.unit}
                  </span>
                </td>
                <td className="px-4 py-3.5">{stockBadge(m)}</td>
                <td className="px-4 py-3.5 text-xs text-slate-500">
                  {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString('en-IN') : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3.5">
                  <PermissionGuard module="medicine_stock" action="update">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(m)}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-2 py-1.5 rounded-lg transition-colors">
                        <Pencil size={11} /> Edit
                      </button>
                      <button onClick={() => { setSelectedMed(m); setStockAdj({ quantity: '', type: 'add' }); setStockModal(true); }}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-600 border border-slate-200 hover:border-emerald-300 px-2 py-1.5 rounded-lg transition-colors">
                        <PackagePlus size={11} /> Stock
                      </button>
                    </div>
                  </PermissionGuard>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-1">
        <p className="text-sm text-slate-400">Showing {total === 0 ? 0 : Math.min((page-1)*20+1, total)}–{Math.min(page*20, total)} of {total}</p>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p-1)}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="flex items-center px-3 text-sm text-slate-500">Page {page} of {Math.ceil(total/20) || 1}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage(p => p+1)}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Add/Edit Medicine Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Medicine' : 'Add Medicine'} size="xl">
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
          {[
            { f: 'name', l: 'Medicine Name', req: true },
            { f: 'genericName', l: 'Generic Name', req: false },
            { f: 'manufacturer', l: 'Manufacturer', req: false },
            { f: 'batchNumber', l: 'Batch Number', req: false },
            { f: 'unit', l: 'Unit (strip/bottle…)', req: false },
          ].map(({ f: field, l, req }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{l}</label>
              <input value={(form as Record<string, string>)[field]} onChange={(e) => f(field, e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors" required={req} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Category</label>
            <select value={form.category} onChange={(e) => f('category', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50">
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Expiry Date</label>
            <input type="date" value={form.expiryDate} onChange={(e) => f('expiryDate', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors" />
          </div>
          {[
            { f: 'mrp', l: 'MRP (₹)', req: true },
            { f: 'purchasePrice', l: 'Purchase Price (₹)', req: false },
            { f: 'sellingPrice', l: 'Selling Price (₹)', req: true },
            { f: 'currentStock', l: 'Current Stock', req: true },
            { f: 'minimumStock', l: 'Minimum Stock Alert', req: false },
          ].map(({ f: field, l, req }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{l}</label>
              <input type="number" value={(form as Record<string, string>)[field]} onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors" required={req} min="0" />
            </div>
          ))}
          <div className="col-span-2 flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Pill size={16} />}
              {saving ? 'Saving…' : 'Save Medicine'}
            </button>
            <button type="button" onClick={() => setModal(false)}
              className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal isOpen={stockModal} onClose={() => setStockModal(false)} title={`Adjust Stock — ${selectedMed?.name}`} size="sm">
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Current Stock</p>
            <p className="text-3xl font-bold text-slate-900">{selectedMed?.currentStock}</p>
            <p className="text-sm text-slate-400">{selectedMed?.unit}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Adjustment Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'add',    label: 'Add Stock',    icon: Plus,  cls: stockAdj.type === 'add'    ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 text-slate-600 hover:border-emerald-300' },
                { val: 'deduct', label: 'Deduct Stock', icon: Minus, cls: stockAdj.type === 'deduct' ? 'bg-red-500 text-white border-red-500'         : 'border-slate-200 text-slate-600 hover:border-red-300' },
              ].map(opt => {
                const Icon = opt.icon;
                return (
                  <button key={opt.val} type="button" onClick={() => setStockAdj(s => ({ ...s, type: opt.val }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${opt.cls}`}>
                    <Icon size={15} /> {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Quantity</label>
            <input type="number" value={stockAdj.quantity} onChange={(e) => setStockAdj(s => ({ ...s, quantity: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors text-center text-lg font-bold" min="1" placeholder="0" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleStockAdj} disabled={saving || !stockAdj.quantity}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <PackagePlus size={16} />}
              {saving ? 'Updating…' : 'Update Stock'}
            </button>
            <button onClick={() => setStockModal(false)}
              className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
