import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { Table } from '../components/Table';
import { PermissionGuard } from '../components/PermissionGuard';

interface Patient { _id: string; patientId: string; name: string; age: number; gender: string; phone: string; email: string; bloodGroup: string; city?: { name: string }; isActive: boolean; createdAt: string; }
interface City { _id: string; name: string; state: string; }

const empty = { name: '', age: '', gender: 'male', phone: '', email: '', address: '', city: '', bloodGroup: '', emergencyContact: '' };

export function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/patients', { params: { search, page, limit: 20 } }),
        api.get('/cities', { params: { all: true } }),
      ]);
      setPatients(pRes.data.data.patients);
      setTotal(pRes.data.data.total);
      setCities(Array.isArray(cRes.data.data) ? cRes.data.data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, page]);

  const openCreate = () => { setForm({ ...empty }); setEditId(null); setModal(true); };
  const openEdit = (p: Patient) => {
    setForm({ name: p.name, age: String(p.age), gender: p.gender, phone: p.phone, email: p.email || '', address: '', city: '', bloodGroup: p.bloodGroup || '', emergencyContact: '' });
    setEditId(p._id);
    setModal(true);
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, age: Number(form.age) };
      if (editId) await api.put(`/patients/${editId}`, payload);
      else await api.post('/patients', payload);
      setModal(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const columns = [
    { key: 'patientId', label: 'Patient ID' },
    { key: 'name', label: 'Name' },
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Gender', render: (r: Patient) => <span className="capitalize">{r.gender}</span> },
    { key: 'phone', label: 'Phone' },
    { key: 'bloodGroup', label: 'Blood Group', render: (r: Patient) => r.bloodGroup || '-' },
    { key: 'city', label: 'City', render: (r: Patient) => r.city?.name || '-' },
    { key: 'actions', label: 'Actions', render: (r: Patient) => (
      <PermissionGuard module="patients" action="update">
        <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
      </PermissionGuard>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-500 text-sm">{total} registered patients</p>
        </div>
        <PermissionGuard module="patients" action="create">
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Patient</button>
        </PermissionGuard>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, phone, ID..." className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <Table columns={columns} data={patients} loading={loading} />

      <div className="flex items-center justify-between mt-4 px-1">
        <p className="text-sm text-slate-400">Showing {total === 0 ? 0 : Math.min((page-1)*20+1, total)}–{Math.min(page*20, total)} of {total}</p>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">Prev</button>
          <span className="flex items-center px-3 text-sm text-slate-500">Page {page} of {Math.ceil(total/20) || 1}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage(p => p+1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">Next</button>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Patient' : 'Add Patient'} size="lg">
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
          {[{ f: 'name', l: 'Full Name', t: 'text' }, { f: 'phone', l: 'Phone', t: 'tel' }, { f: 'email', l: 'Email', t: 'email' }, { f: 'emergencyContact', l: 'Emergency Contact', t: 'tel' }].map(({ f, l, t }) => (
            <div key={f}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{l}</label>
              <input type={t} value={(form as Record<string, string>)[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required={f === 'name' || f === 'phone'} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
            <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required min="0" max="150" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {['male', 'female', 'other'].map(g => <option key={g} value={g} className="capitalize">{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
            <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
            <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select City</option>
              {cities.map(c => <option key={c._id} value={c._id}>{c.name}, {c.state}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="col-span-2 flex gap-3">
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Patient'}
            </button>
            <button type="button" onClick={() => setModal(false)} className="flex-1 border border-slate-300 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

