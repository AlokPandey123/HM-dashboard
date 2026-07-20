import { useEffect, useState } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { Table } from '../components/Table';
import { PermissionGuard } from '../components/PermissionGuard';

interface Patient { _id: string; patientId: string; name: string; age: number; gender: string; phone: string; address?: string; city?: { name: string }; marriageYear?: number; patientType: string; isActive: boolean; createdAt: string; }
interface City { _id: string; name: string; state: string; }
interface PatientDetailState {
  patient: Patient | null;
  opds: Array<{ _id: string; opdId?: string; visitDate?: string; fees?: number; paymentStatus?: string; paymentMode?: string; amountPaid?: number; notes?: string; doctor?: { name?: string; specialization?: string } | null }>;
  regularCheckups: Array<{ _id: string; checkupId?: string; visitDate?: string; fees?: number; paymentStatus?: string; paymentMode?: string; amountPaid?: number; notes?: string; feeApplicable?: boolean; doctor?: { name?: string; specialization?: string } | null }>;
  testBookings: Array<{ _id: string; bookingId?: string; bookedDate?: string; totalAmount?: number; netAmount?: number; paymentStatus?: string; paymentMode?: string; tests?: Array<{ test?: { name?: string; code?: string; category?: string }; status?: string; result?: string }> }>;
  bills: Array<{ _id: string; billId?: string; createdAt?: string; totalAmount?: number; amountPaid?: number; paymentStatus?: string; paymentMode?: string }>;
  returns: Array<{ _id: string; returnId?: string; createdAt?: string; totalReturnAmount?: number; totalDeduction?: number; status?: string; reason?: string }>;
}

const empty = { name: '', age: '', gender: '', phone: '', city: '', address: '', marriageYear: '', patientType: 'regular' };

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
  const [detailModal, setDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<PatientDetailState>({ patient: null, opds: [], regularCheckups: [], testBookings: [], bills: [], returns: [] });

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
    setForm({ name: p.name, age: String(p.age), gender: p.gender, phone: p.phone, city: '', address: p.address || '', marriageYear: p.marriageYear ? String(p.marriageYear) : '', patientType: p.patientType || 'regular' });
    setEditId(p._id);
    setModal(true);
  };

  const openView = async (p: Patient) => {
    setDetailModal(true);
    setDetailLoading(true);
    setDetailData({ patient: null, opds: [], regularCheckups: [], testBookings: [], bills: [], returns: [] });
    try {
      const res = await api.get(`/patients/${p._id}/view`);
      setDetailData(res.data.data || { patient: null, opds: [], regularCheckups: [], testBookings: [], bills: [], returns: [] });
    } catch (err) {
      console.error(err);
      alert('Could not load patient details');
      setDetailModal(false);
    } finally { setDetailLoading(false); }
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, age: Number(form.age), marriageYear: form.marriageYear ? Number(form.marriageYear) : undefined };
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
    { key: 'city', label: 'City', render: (r: Patient) => r.city?.name || '-' },
    { key: 'address', label: 'Address', render: (r: Patient) => r.address || '-' },
    { key: 'marriageYear', label: 'Married Yrs', render: (r: Patient) => r.marriageYear || '-' },
    { key: 'patientType', label: 'Type', render: (r: Patient) => (
      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${r.patientType === 'regular' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{r.patientType || 'regular'}</span>
    )},
    { key: 'actions', label: 'Actions', render: (r: Patient) => (
      <div className="flex gap-2">
        <button onClick={() => openView(r)} className="flex items-center justify-center text-slate-600 hover:text-blue-700" title="View patient details">
          <Eye size={14} />
        </button>
        <PermissionGuard module="patients" action="update">
          <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
        </PermissionGuard>
      </div>
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

      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title={detailLoading ? 'Loading patient details...' : (detailData.patient?.name || 'Patient details')} size="xl">
        {detailLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 size={20} className="mr-2 animate-spin" /> Loading...</div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <div><span className="font-semibold text-slate-700">Patient ID:</span> {detailData.patient?.patientId}</div>
                <div><span className="font-semibold text-slate-700">Phone:</span> {detailData.patient?.phone}</div>
                <div><span className="font-semibold text-slate-700">Age:</span> {detailData.patient?.age} yrs</div>
                <div><span className="font-semibold text-slate-700">Gender:</span> {detailData.patient?.gender}</div>
                <div><span className="font-semibold text-slate-700">Type:</span> {detailData.patient?.patientType || 'regular'}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">OPD Visits</h3>
              {detailData.opds.length === 0 ? <p className="text-sm text-slate-400">No OPD visits found.</p> : (
                <div className="space-y-2">
                  {detailData.opds.map(opd => (
                    <div key={opd._id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold text-slate-800">{opd.opdId || 'OPD'}</span>
                        <span>{opd.visitDate ? new Date(opd.visitDate).toLocaleDateString('en-IN') : '-'}</span>
                      </div>
                      <div className="mt-1">Doctor: {opd.doctor?.name ? `${opd.doctor.name}${opd.doctor.specialization ? ` (${opd.doctor.specialization})` : ''}` : '—'}</div>
                      <div>Fees: ₹{Number(opd.fees || 0).toLocaleString('en-IN')} · Paid: ₹{Number(opd.amountPaid || 0).toLocaleString('en-IN')} · Status: {opd.paymentStatus || 'pending'}</div>
                      {opd.notes ? <div className="mt-1 text-slate-500">{opd.notes}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Regular Checkups</h3>
              {detailData.regularCheckups.length === 0 ? <p className="text-sm text-slate-400">No regular checkups found.</p> : (
                <div className="space-y-2">
                  {detailData.regularCheckups.map(checkup => (
                    <div key={checkup._id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold text-slate-800">{checkup.checkupId || 'Checkup'}</span>
                        <span>{checkup.visitDate ? new Date(checkup.visitDate).toLocaleDateString('en-IN') : '-'}</span>
                      </div>
                      <div className="mt-1">Doctor: {checkup.doctor?.name ? `${checkup.doctor.name}${checkup.doctor.specialization ? ` (${checkup.doctor.specialization})` : ''}` : '—'}</div>
                      <div>Fee Applicable: {checkup.feeApplicable ? 'Yes' : 'No'} · Fees: ₹{Number(checkup.fees || 0).toLocaleString('en-IN')}</div>
                      {checkup.notes ? <div className="mt-1 text-slate-500">{checkup.notes}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Pathology Tests</h3>
              {detailData.testBookings.length === 0 ? <p className="text-sm text-slate-400">No pathology bookings found.</p> : (
                <div className="space-y-2">
                  {detailData.testBookings.map(booking => (
                    <div key={booking._id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold text-slate-800">{booking.bookingId || 'Booking'}</span>
                        <span>{booking.bookedDate ? new Date(booking.bookedDate).toLocaleDateString('en-IN') : '-'}</span>
                      </div>
                      <div className="mt-1">Total: ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')} · Net: ₹{Number(booking.netAmount || 0).toLocaleString('en-IN')} · Status: {booking.paymentStatus || 'pending'}</div>
                      {booking.tests?.map((testItem, idx) => (
                        <div key={`${booking._id}-${idx}`} className="mt-1 text-slate-500">
                          • {testItem.test?.name || 'Test'} ({testItem.test?.code || '-'}) — {testItem.status || 'pending'}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Billing</h3>
              {detailData.bills.length === 0 ? <p className="text-sm text-slate-400">No bills found.</p> : (
                <div className="space-y-2">
                  {detailData.bills.map(bill => (
                    <div key={bill._id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold text-slate-800">{bill.billId || 'Bill'}</span>
                        <span>{bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN') : '-'}</span>
                      </div>
                      <div className="mt-1">Total: ₹{Number(bill.totalAmount || 0).toLocaleString('en-IN')} · Paid: ₹{Number(bill.amountPaid || 0).toLocaleString('en-IN')} · Status: {bill.paymentStatus || 'pending'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Returns</h3>
              {detailData.returns.length === 0 ? <p className="text-sm text-slate-400">No returns found.</p> : (
                <div className="space-y-2">
                  {detailData.returns.map(ret => (
                    <div key={ret._id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold text-slate-800">{ret.returnId || 'Return'}</span>
                        <span>{ret.createdAt ? new Date(ret.createdAt).toLocaleDateString('en-IN') : '-'}</span>
                      </div>
                      <div className="mt-1">Amount: ₹{Number(ret.totalReturnAmount || 0).toLocaleString('en-IN')} · Deduction: ₹{Number(ret.totalDeduction || 0).toLocaleString('en-IN')} · Status: {ret.status || 'pending'}</div>
                      {ret.reason ? <div className="mt-1 text-slate-500">{ret.reason}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Patient' : 'Add Patient'} size="lg">
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name <span className="ml-1 text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number <span className="ml-1 text-red-500">*</span></label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Age <span className="ml-1 text-red-500">*</span></label>
            <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required min="0" max="150" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gender <span className="ml-1 text-red-500">*</span></label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select Gender</option>
              {['male', 'female', 'other'].map(g => <option key={g} value={g} className="capitalize">{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City <span className="ml-1 text-red-500">*</span></label>
            <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select City</option>
              {cities.map(c => <option key={c._id} value={c._id}>{c.name}, {c.state}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Years Married</label>
            <input type="number" value={form.marriageYear} onChange={(e) => setForm({ ...form, marriageYear: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" min="1" placeholder="e.g. 5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient Type <span className="ml-1 text-red-500">*</span></label>
            <select value={form.patientType} onChange={(e) => setForm({ ...form, patientType: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="regular">Regular</option>
              <option value="irregular">Irregular</option>
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

