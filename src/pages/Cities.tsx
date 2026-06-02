import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { Table } from '../components/Table';
import { useAuthStore } from '../store/authStore';

interface City { _id: string; name: string; state: string; country: string; isActive: boolean; createdAt: string; }

const empty = { name: '', state: '', country: 'India' };

export function Cities() {
  const [cities, setCities] = useState<City[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/cities', { params: { search, page, limit: 20 } });
      setCities(r.data.data.cities || r.data.data);
      setTotal(r.data.data.total || 0);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, page]);

  const openCreate = () => { setForm(empty); setEditId(null); setModal(true); };
  const openEdit = (c: City) => { setForm({ name: c.name, state: c.state, country: c.country }); setEditId(c._id); setModal(true); };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) await api.put(`/cities/${editId}`, form);
      else await api.post('/cities', form);
      setModal(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error saving city');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this city?')) return;
    try {
      await api.delete(`/cities/${id}`);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error deleting city');
    }
  };

  const columns = [
    { key: 'name', label: 'City Name' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'isActive', label: 'Status', render: (row: City) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', label: 'Actions', render: (row: City) => (
      <div className="flex gap-2">
        {hasPermission('cities', 'update') && (
          <button onClick={() => openEdit(row)} className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors">
            Edit
          </button>
        )}
        {hasPermission('cities', 'delete') && (
          <button onClick={() => handleDelete(row._id)} className="text-red-600 hover:text-red-800 text-xs font-medium border border-red-200 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
            Delete
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Cities</h1>
          <p className="text-slate-500 text-sm">{total} cities configured</p>
        </div>
        {hasPermission('cities', 'create') && (
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + Add City
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search cities..."
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <Table columns={columns} data={cities} loading={loading} />

      <div className="flex items-center justify-between mt-4 px-1">
        <p className="text-sm text-slate-400">Showing {total === 0 ? 0 : Math.min((page-1)*20+1, total)}-{Math.min(page*20, total)} of {total}</p>
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

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit City' : 'Add City'}>
        <form onSubmit={handleSave} className="space-y-4">
          {(['name', 'state', 'country'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">{field}</label>
              <input
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save City'}
            </button>
            <button type="button" onClick={() => setModal(false)} className="flex-1 border border-slate-300 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
