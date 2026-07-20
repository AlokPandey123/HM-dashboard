import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { Table } from '../components/Table';
import { PermissionGuard } from '../components/PermissionGuard';
import { SearchSelect } from '../components/SearchSelect';

interface Patient { _id: string; patientId: string; name: string; phone: string; patientType: string; }
interface Doctor { _id: string; name: string; specialization?: string; }
interface Checkup {
  _id: string; checkupId: string; visitDate: string; notes?: string;
  feeApplicable: boolean; fees: number; paymentStatus: string; paymentMode: string; amountPaid: number;
  patient: Patient; doctor: Doctor; createdAt: string;
}

const emptyForm = {
  patientId: '', patientLabel: '',
  doctorId: '', doctorLabel: '',
  visitDate: new Date().toISOString().slice(0, 10),
  notes: '', feeApplicable: false,
  fees: '', paymentStatus: 'pending', paymentMode: 'cash', amountPaid: '',
};

const statusBadge: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  partial: 'bg-orange-100 text-orange-700',
};

export function RegularCheckup() {
  const [checkups, setCheckups] = useState<Checkup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/regular-checkup', { params: { page, limit: 20 } });
      setCheckups(r.data.data.checkups);
      setTotal(r.data.data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const searchPatients = async (q: string) => {
    const r = await api.get('/patients', { params: { search: q, patientType: 'regular', limit: 8 } });
    const list: Patient[] = r.data.data.patients || [];
    return list.map(p => ({ _id: p._id, label: p.name, sublabel: `${p.patientId} · ${p.phone}` }));
  };

  const searchDoctors = async (q: string) => {
    const r = await api.get('/doctors', { params: { search: q, limit: 8 } });
    const list: Doctor[] = r.data.data.doctors || [];
    return list.map(d => ({ _id: d._id, label: `Dr. ${d.name}`, sublabel: d.specialization }));
  };

  const openCreate = () => { setForm({ ...emptyForm }); setEditId(null); setModal(true); };
  const openEdit = (c: Checkup) => {
    setForm({
      patientId: c.patient?._id || '', patientLabel: c.patient?.name || '',
      doctorId: c.doctor?._id || '', doctorLabel: c.doctor ? `Dr. ${c.doctor.name}` : '',
      visitDate: c.visitDate ? c.visitDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: c.notes || '', feeApplicable: c.feeApplicable,
      fees: c.fees ? String(c.fees) : '', paymentStatus: c.paymentStatus || 'pending',
      paymentMode: c.paymentMode || 'cash', amountPaid: c.amountPaid ? String(c.amountPaid) : '',
    });
    setEditId(c._id);
    setModal(true);
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        patient: form.patientId, doctor: form.doctorId,
        visitDate: form.visitDate, notes: form.notes,
        feeApplicable: form.feeApplicable,
      };
      if (form.feeApplicable) {
        payload.fees = Number(form.fees);
        payload.paymentStatus = form.paymentStatus;
        payload.paymentMode = form.paymentMode;
        payload.amountPaid = form.amountPaid ? Number(form.amountPaid) : 0;
      }
      if (editId) await api.put(`/regular-checkup/${editId}`, payload);
      else await api.post('/regular-checkup', payload);
      setModal(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const columns = [
    { key: 'checkupId', label: 'Checkup ID' },
    { key: 'patient', label: 'Patient', render: (r: Checkup) => (
      <div>
        <div className="font-medium text-slate-800">{r.patient?.name}</div>
        <div className="text-xs text-slate-400">{r.patient?.patientId} · <span className="capitalize">{r.patient?.patientType}</span></div>
      </div>
    )},
    { key: 'doctor', label: 'Doctor', render: (r: Checkup) => (
      <div>
        <div className="font-medium text-slate-800">{r.doctor ? `Dr. ${r.doctor.name}` : '—'}</div>
        {r.doctor?.specialization && <div className="text-xs text-slate-400">{r.doctor.specialization}</div>}
      </div>
    )},
    { key: 'visitDate', label: 'Visit Date', render: (r: Checkup) => new Date(r.visitDate).toLocaleDateString() },
    { key: 'notes', label: 'Notes', render: (r: Checkup) => <span className="text-slate-500 text-xs max-w-[180px] truncate block">{r.notes || '—'}</span> },
    { key: 'fee', label: 'Fee', render: (r: Checkup) =>
      r.feeApplicable
        ? <div>
            <div className="font-semibold text-slate-800">₹{r.fees}</div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge[r.paymentStatus]}`}>{r.paymentStatus}</span>
          </div>
        : <span className="text-xs text-slate-400">No Fee</span>
    },
    { key: 'actions', label: 'Actions', render: (r: Checkup) => (
      <PermissionGuard module="regular_checkup" action="update">
        <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
      </PermissionGuard>
    )},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Regular Checkups</h1>
          <p className="text-slate-500 text-sm">{total} total checkups</p>
        </div>
        <PermissionGuard module="regular_checkup" action="create">
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Checkup</button>
        </PermissionGuard>
      </div>

      <Table columns={columns} data={checkups} loading={loading} />

      <div className="flex items-center justify-between mt-4 px-1">
        <p className="text-sm text-slate-400">Showing {total === 0 ? 0 : Math.min((page-1)*20+1, total)}–{Math.min(page*20, total)} of {total}</p>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40">Prev</button>
          <span className="flex items-center px-3 text-sm text-slate-500">Page {page} of {Math.ceil(total/20) || 1}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage(p => p+1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next</button>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Checkup' : 'Add Regular Checkup'} size="lg">
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">

          <SearchSelect
            label="Patient"
            value={form.patientId}
            displayValue={form.patientLabel}
            onSelect={(item) => setForm(f => ({ ...f, patientId: item?._id ?? '', patientLabel: item?.label ?? '' }))}
            onSearch={searchPatients}
            placeholder="Search regular patients…"
            required
          />

          <SearchSelect
            label="Doctor"
            value={form.doctorId}
            displayValue={form.doctorLabel}
            onSelect={(item) => setForm(f => ({ ...f, doctorId: item?._id ?? '', doctorLabel: item?.label ?? '' }))}
            onSearch={searchDoctors}
            placeholder="Search doctors…"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Visit Date <span className="text-red-500">*</span></label>
            <input type="date" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input type="checkbox" checked={form.feeApplicable}
                  onChange={(e) => setForm({ ...form, feeApplicable: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm font-medium text-slate-700">Fee Applicable</span>
            </label>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              placeholder="Observations, diagnosis, instructions…"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {form.feeApplicable && (
            <>
              <div className="col-span-2">
                <div className="border-t border-slate-100 pt-3 mb-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fee Details</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Fee (₹) <span className="text-red-500">*</span></label>
                <input type="number" value={form.fees} onChange={(e) => setForm({ ...form, fees: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required min="0" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount Paid (₹)</label>
                <input type="number" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Status <span className="text-red-500">*</span></label>
                <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode <span className="text-red-500">*</span></label>
                <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="insurance">Insurance</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </>
          )}

          <div className="col-span-2 flex gap-3">
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Checkup'}
            </button>
            <button type="button" onClick={() => setModal(false)} className="flex-1 border border-slate-300 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
