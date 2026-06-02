import { useEffect, useState } from 'react';
import { Stethoscope, Plus, ChevronLeft, ChevronRight, Loader2, CheckCircle, Clock, AlertCircle, Filter, Banknote, CreditCard, Smartphone, Shield, Globe } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { PermissionGuard } from '../components/PermissionGuard';

interface OPD { _id: string; opdId: string; patient: { name: string; patientId: string }; doctor: string; visitDate: string; fees: number; paymentStatus: string; paymentMode: string; diagnosis: string; amountPaid: number; }
interface Patient { _id: string; name: string; patientId: string; }

const empty = { patient: '', doctor: '', visitDate: new Date().toISOString().split('T')[0], symptoms: '', diagnosis: '', prescription: '', fees: '', paymentStatus: 'pending', paymentMode: 'cash', amountPaid: '', notes: '' };

const statusConfig: Record<string, { label: string; cls: string; icon: typeof CheckCircle }> = {
  paid:    { label: 'Paid',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  pending: { label: 'Pending', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200',   icon: Clock },
  partial: { label: 'Partial', cls: 'bg-orange-50 text-orange-700 border-orange-200',   icon: AlertCircle },
};

const MODE_ICONS = { cash: Banknote, card: CreditCard, upi: Smartphone, insurance: Shield, online: Globe };

export function OPD() {
  const [opds, setOpds] = useState<OPD[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const oRes = await api.get('/opd', { params: { page, limit: 20, paymentStatus: statusFilter || undefined } });
      setOpds(oRes.data.data.opds);
      setTotal(oRes.data.data.total);
    } finally { setLoading(false); }
    try {
      const pRes = await api.get('/patients', { params: { all: true } });
      setPatients(Array.isArray(pRes.data.data) ? pRes.data.data : []);
    } catch { /* form data only */ }
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/opd', { ...form, fees: Number(form.fees), amountPaid: Number(form.amountPaid) });
      setModal(false);
      setForm({ ...empty });
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const f = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">OPD Records</h1>
          <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
            <Stethoscope size={13} /> {total} total OPD visits
          </p>
        </div>
        <PermissionGuard module="opd" action="create">
          <button onClick={() => { setForm({ ...empty }); setModal(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors">
            <Plus size={16} /> New OPD Visit
          </button>
        </PermissionGuard>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4 flex gap-3 items-center">
        <Filter size={15} className="text-slate-400" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50">
          <option value="">All Status</option>
          {['pending', 'paid', 'partial'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['OPD ID', 'Patient', 'Doctor', 'Visit Date', 'Fees', 'Paid', 'Status', 'Mode'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center">
                <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
              </td></tr>
            ) : opds.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-slate-400">
                <Stethoscope size={32} className="mx-auto mb-2 opacity-30" />No OPD records found
              </td></tr>
            ) : opds.map(o => {
              const status = statusConfig[o.paymentStatus] ?? statusConfig.pending;
              const StatusIcon = status.icon;
              const ModeIcon = MODE_ICONS[o.paymentMode as keyof typeof MODE_ICONS] ?? Banknote;
              return (
                <tr key={o._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">{o.opdId}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800 text-sm">{o.patient?.name}</p>
                    <p className="text-xs text-slate-400">{o.patient?.patientId}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-700">{o.doctor}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{new Date(o.visitDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">&#8377;{o.fees.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5 font-semibold text-emerald-600">&#8377;{(o.amountPaid ?? 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.cls}`}>
                      <StatusIcon size={11} /> {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 capitalize">
                      <ModeIcon size={13} />{o.paymentMode}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Page {page} &mdash; {total} total records</p>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
            <ChevronLeft size={14} /> Prev
          </button>
          <button disabled={opds.length < 20} onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* New OPD Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="New OPD Visit" size="lg">
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Patient</label>
            <select value={form.patient} onChange={(e) => f('patient', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required>
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Doctor Name</label>
            <input value={form.doctor} onChange={(e) => f('doctor', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors" required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Visit Date</label>
            <input type="date" value={form.visitDate} onChange={(e) => f('visitDate', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors" required />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Symptoms</label>
            <textarea value={form.symptoms} onChange={(e) => f('symptoms', e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white resize-none transition-colors" />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Diagnosis</label>
            <textarea value={form.diagnosis} onChange={(e) => f('diagnosis', e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white resize-none transition-colors" />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Prescription</label>
            <textarea value={form.prescription} onChange={(e) => f('prescription', e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white resize-none transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Consultation Fees (&#8377;)</label>
            <input type="number" value={form.fees} onChange={(e) => f('fees', e.target.value)} min="0"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors" required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Amount Paid (&#8377;)</label>
            <input type="number" value={form.amountPaid} onChange={(e) => f('amountPaid', e.target.value)} min="0"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Payment Status</label>
            <select value={form.paymentStatus} onChange={(e) => f('paymentStatus', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50">
              {['pending', 'paid', 'partial'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Payment Mode</label>
            <select value={form.paymentMode} onChange={(e) => f('paymentMode', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50">
              {['cash', 'card', 'upi', 'insurance', 'online'].map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => f('notes', e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white resize-none transition-colors" placeholder="Additional notes..." />
          </div>

          <div className="col-span-2 flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Stethoscope size={16} />}
              {saving ? 'Saving...' : 'Save OPD Record'}
            </button>
            <button type="button" onClick={() => setModal(false)}
              className="px-6 border border-slate-200 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
