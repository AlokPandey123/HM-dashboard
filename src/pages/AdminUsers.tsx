import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { Table } from '../components/Table';
import { useAuthStore } from '../store/authStore';

interface User { _id: string; name: string; email: string; role: string; isActive: boolean; phone: string; permissions: { module: string; actions: string[] }[]; hospitalCity?: { name: string }; createdAt: string; }
interface City { _id: string; name: string; state: string; }

const ALL_MODULES = ['dashboard', 'cities', 'admin_users', 'patients', 'opd', 'pathology', 'billing', 'medicine_stock', 'reports', 'returns', 'doctors', 'regular_checkup'];
const ALL_ACTIONS = ['view', 'create', 'update', 'delete'];

const emptyForm = { name: '', email: '', password: '', phone: '', role: 'admin', hospitalCity: '', permissions: [] as { module: string; actions: string[] }[] };

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [permModal, setPermModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);

  const load = async () => {
    setLoading(true);
    try {
      const [uRes, cRes] = await Promise.all([
        api.get('/users', { params: { search, role: roleFilter || undefined, page, limit: 20 } }),
        api.get('/cities', { params: { all: true } }),
      ]);
      setUsers(uRes.data.data.users);
      setTotal(uRes.data.data.total || 0);
      setCities(Array.isArray(cRes.data.data) ? cRes.data.data : cRes.data.data.cities || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, roleFilter, page]);

  const openCreate = () => { setForm({ ...emptyForm }); setEditId(null); setModal(true); };

  const openPermissions = (user: User) => {
    setSelectedUser(user);
    setForm(prev => ({ ...prev, permissions: user.permissions || [] }));
    setPermModal(true);
  };

  const togglePerm = (module: string, action: string) => {
    setForm((prev) => {
      const perms = [...prev.permissions];
      const idx = perms.findIndex((p) => p.module === module);
      if (idx === -1) {
        perms.push({ module, actions: [action] });
      } else {
        const actions = perms[idx].actions.includes(action)
          ? perms[idx].actions.filter((a) => a !== action)
          : [...perms[idx].actions, action];
        if (actions.length === 0) perms.splice(idx, 1);
        else perms[idx] = { ...perms[idx], actions };
      }
      return { ...prev, permissions: perms };
    });
  };

  const hasPerm = (module: string, action: string) =>
    form.permissions.some((p) => p.module === module && p.actions.includes(action));

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete (payload as { password?: string }).password;
      if (editId) await api.put(`/users/${editId}`, payload);
      else await api.post('/users', payload);
      setModal(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error saving user');
    } finally { setSaving(false); }
  };

  const handleUpdatePerms = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await api.put(`/users/${selectedUser._id}/permissions`, { permissions: form.permissions });
      setPermModal(false);
      load();
    } finally { setSaving(false); }
  };

  const toggleStatus = async (id: string) => {
    await api.patch(`/users/${id}/toggle-status`);
    load();
  };

  const roleColors: Record<string, string> = {
    superadmin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    manager: 'bg-green-100 text-green-700',
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (row: User) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[row.role]}`}>{row.role}</span>
    )},
    { key: 'city', label: 'City', render: (row: User) => row.hospitalCity?.name || '-' },
    { key: 'isActive', label: 'Status', render: (row: User) => (
      <div className="flex items-center gap-2">
        {isSuperAdmin() && row.role !== 'superadmin' ? (
          <button
            onClick={() => toggleStatus(row._id)}
            title={row.isActive ? 'Click to deactivate' : 'Click to activate'}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${row.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${row.isActive ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
          </button>
        ) : (
          <span className={`w-2 h-2 rounded-full ${row.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        )}
        <span className={`text-xs font-medium ${row.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    )},
    { key: 'actions', label: 'Actions', render: (row: User) => (
      <button onClick={() => openPermissions(row)} className="text-purple-600 hover:text-purple-800 text-xs font-medium border border-purple-200 hover:bg-purple-50 px-2 py-1 rounded-lg transition-colors">
        Permissions
      </button>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Users</h1>
          <p className="text-slate-500 text-sm">Manage admins and managers with permissions</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Create User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4 flex gap-3 flex-wrap">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search users..." className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
        </select>
      </div>

      <Table columns={columns} data={users} loading={loading} />

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

      {/* Create/Edit User Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit User' : 'Create User'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password {editId && '(leave blank to keep)'}</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required={!editId} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <select value={form.hospitalCity} onChange={(e) => setForm({ ...form, hospitalCity: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select City</option>
                {cities.map((c) => <option key={c._id} value={c._id}>{c.name}, {c.state}</option>)}
              </select>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Module Permissions</p>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Module</th>
                    {ALL_ACTIONS.map((a) => <th key={a} className="px-3 py-2 text-center font-semibold text-slate-600 capitalize">{a}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ALL_MODULES.map((mod) => (
                    <tr key={mod} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-700 capitalize">{mod.replace('_', ' ')}</td>
                      {ALL_ACTIONS.map((action) => (
                        <td key={action} className="px-3 py-2 text-center">
                          <input type="checkbox" checked={hasPerm(mod, action)} onChange={() => togglePerm(mod, action)} className="rounded" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save User'}
            </button>
            <button type="button" onClick={() => setModal(false)} className="flex-1 border border-slate-300 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Permissions Modal */}
      <Modal isOpen={permModal} onClose={() => setPermModal(false)} title={'Permissions: ' + (selectedUser?.name || '')} size="lg">
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Module</th>
                {ALL_ACTIONS.map((a) => <th key={a} className="px-3 py-2 text-center font-semibold text-slate-600 capitalize">{a}</th>)}
              </tr>
            </thead>
            <tbody>
              {ALL_MODULES.map((mod) => (
                <tr key={mod} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-700 capitalize">{mod.replace('_', ' ')}</td>
                  {ALL_ACTIONS.map((action) => (
                    <td key={action} className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={form.permissions.some((p) => p.module === mod && p.actions.includes(action))}
                        onChange={() => togglePerm(mod, action)}
                        className="rounded"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3">
          <button onClick={handleUpdatePerms} disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Updating...' : 'Update Permissions'}
          </button>
          <button onClick={() => setPermModal(false)} className="flex-1 border border-slate-300 py-2 rounded-lg text-sm">Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

