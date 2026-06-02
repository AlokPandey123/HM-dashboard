import { useEffect, useState } from 'react';
import { FlaskConical, Plus, TestTube, Loader2, CheckCircle, Clock, AlertCircle, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { PermissionGuard } from '../components/PermissionGuard';

interface Test { _id: string; name: string; code: string; category: string; price: number; processingTime: string; sampleType: string; isActive: boolean; }
interface Booking { _id: string; bookingId: string; patient: { name: string; patientId: string }; totalAmount: number; netAmount: number; paymentStatus: string; bookedDate: string; tests: { test: { name: string }; status: string }[]; }
interface Patient { _id: string; name: string; patientId: string; }

const emptyTest    = { name: '', code: '', description: '', category: '', price: '', processingTime: '24 hours', normalRange: '', sampleType: 'Blood' };
const emptyBooking = { patient: '', testIds: [] as string[], discount: '', paymentStatus: 'pending', paymentMode: 'cash', amountPaid: '', notes: '' };

const payStatusConfig: Record<string, { label: string; cls: string; icon: typeof CheckCircle }> = {
  paid:    { label: 'Paid',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  pending: { label: 'Pending', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200',   icon: Clock },
  partial: { label: 'Partial', cls: 'bg-orange-50 text-orange-700 border-orange-200',   icon: AlertCircle },
};

const categoryColors: Record<string, string> = {
  Haematology:   'bg-red-50 text-red-700 border-red-200',
  Biochemistry:  'bg-blue-50 text-blue-700 border-blue-200',
  Serology:      'bg-purple-50 text-purple-700 border-purple-200',
  Urine:         'bg-yellow-50 text-yellow-700 border-yellow-200',
  Endocrinology: 'bg-pink-50 text-pink-700 border-pink-200',
  Microbiology:  'bg-green-50 text-green-700 border-green-200',
  Cardiology:    'bg-rose-50 text-rose-700 border-rose-200',
};

export function Pathology() {
  const [activeTab, setActiveTab] = useState<'tests' | 'bookings'>('tests');
  const [tests, setTests] = useState<Test[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingTotal, setBookingTotal] = useState(0);
  const [bookingPage, setBookingPage] = useState(1);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [testModal, setTestModal] = useState(false);
  const [bookingModal, setBookingModal] = useState(false);
  const [testForm, setTestForm] = useState({ ...emptyTest });
  const [bookingForm, setBookingForm] = useState({ ...emptyBooking });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, bRes] = await Promise.all([
        api.get('/pathology/tests', { params: { all: true } }),
        api.get('/pathology/bookings', { params: { page: bookingPage, limit: 20 } }),
      ]);
      setTests(Array.isArray(tRes.data.data) ? tRes.data.data : tRes.data.data.tests || []);
      setBookings(bRes.data.data.bookings);
      setBookingTotal(bRes.data.data.total || 0);
    } finally { setLoading(false); }
    try {
      const pRes = await api.get('/patients', { params: { all: true } });
      setPatients(Array.isArray(pRes.data.data) ? pRes.data.data : []);
    } catch { /* form data only */ }
  };

  useEffect(() => { load(); }, [bookingPage]);

  const handleSaveTest = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/pathology/tests', { ...testForm, price: Number(testForm.price) });
      setTestModal(false);
      setTestForm({ ...emptyTest });
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleSaveBooking = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (bookingForm.testIds.length === 0) { alert('Select at least one test'); return; }
    setSaving(true);
    try {
      await api.post('/pathology/bookings', { ...bookingForm, discount: Number(bookingForm.discount || 0), amountPaid: Number(bookingForm.amountPaid || 0) });
      setBookingModal(false);
      setBookingForm({ ...emptyBooking });
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const toggleTest = (id: string) =>
    setBookingForm(prev => ({ ...prev, testIds: prev.testIds.includes(id) ? prev.testIds.filter(t => t !== id) : [...prev.testIds, id] }));

  const selectedTotal = tests.filter(t => bookingForm.testIds.includes(t._id)).reduce((s, t) => s + t.price, 0);
  const netTotal = selectedTotal - Number(bookingForm.discount || 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pathology</h1>
          <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
            <FlaskConical size={13} /> Tests management and bookings
          </p>
        </div>
        <div className="flex gap-2">
          <PermissionGuard module="pathology" action="create">
            <button onClick={() => { setTestForm({ ...emptyTest }); setTestModal(true); }}
              className="flex items-center gap-2 border border-blue-600 text-blue-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors">
              <TestTube size={16} /> Add Test
            </button>
            <button onClick={() => { setBookingForm({ ...emptyBooking }); setBookingModal(true); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors">
              <Plus size={16} /> Book Tests
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['tests', 'bookings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}>
            {tab === 'tests' ? 'Available Tests' : 'Booking History'}
          </button>
        ))}
      </div>

      {/* Tests Table */}
      {activeTab === 'tests' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Code', 'Test Name', 'Category', 'Sample', 'Processing', 'Price', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center">
                  <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                </td></tr>
              ) : tests.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">
                  <FlaskConical size={32} className="mx-auto mb-2 opacity-30" />No tests found
                </td></tr>
              ) : tests.map(t => (
                <tr key={t._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">{t.code}</span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{t.name}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${categoryColors[t.category] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>{t.category}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{t.sampleType}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{t.processingTime}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">&#8377;{t.price.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${t.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Bookings Table */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Booking ID', 'Patient', 'Tests', 'Net Amount', 'Payment', 'Test Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center">
                  <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                </td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">
                  <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />No bookings found
                </td></tr>
              ) : bookings.map(b => {
                const status = payStatusConfig[b.paymentStatus] ?? payStatusConfig.pending;
                const StatusIcon = status.icon;
                const done = b.tests.filter(t => t.status === 'completed').length;
                const allDone = done === b.tests.length;
                return (
                  <tr key={b._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">{b.bookingId}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800 text-sm">{b.patient?.name}</p>
                      <p className="text-xs text-slate-400">{b.patient?.patientId}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {b.tests.map((t, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium border border-purple-100">{t.test?.name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">&#8377;{b.netAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.cls}`}>
                        <StatusIcon size={11} /> {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${allDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        {done}/{b.tests.length} done
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{new Date(b.bookedDate).toLocaleDateString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bookings Pagination */}
      {activeTab === 'bookings' && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-slate-400">Showing {bookingTotal === 0 ? 0 : Math.min((bookingPage-1)*20+1, bookingTotal)}–{Math.min(bookingPage*20, bookingTotal)} of {bookingTotal}</p>
          <div className="flex gap-2">
            <button disabled={bookingPage === 1} onClick={() => setBookingPage(p => p-1)}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="flex items-center px-3 text-sm text-slate-500">Page {bookingPage} of {Math.ceil(bookingTotal/20) || 1}</span>
            <button disabled={bookingPage * 20 >= bookingTotal} onClick={() => setBookingPage(p => p+1)}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Add Test Modal */}
      <Modal isOpen={testModal} onClose={() => setTestModal(false)} title="Add Pathology Test">
        <form onSubmit={handleSaveTest} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { f: 'name',           l: 'Test Name',      req: true  },
              { f: 'code',           l: 'Test Code',      req: true  },
              { f: 'category',       l: 'Category',       req: true  },
              { f: 'sampleType',     l: 'Sample Type',    req: false },
              { f: 'processingTime', l: 'Processing Time',req: false },
              { f: 'normalRange',    l: 'Normal Range',   req: false },
            ].map(({ f, l, req }) => (
              <div key={f}>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{l}</label>
                <input value={(testForm as Record<string, string>)[f]}
                  onChange={(e) => setTestForm({ ...testForm, [f]: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  required={req} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Price (&#8377;)</label>
              <input type="number" value={testForm.price}
                onChange={(e) => setTestForm({ ...testForm, price: e.target.value })} min="0"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Description</label>
            <textarea value={testForm.description} onChange={(e) => setTestForm({ ...testForm, description: e.target.value })} rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white resize-none transition-colors" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <TestTube size={16} />}
              {saving ? 'Saving...' : 'Add Test'}
            </button>
            <button type="button" onClick={() => setTestModal(false)}
              className="px-6 border border-slate-200 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Book Tests Modal */}
      <Modal isOpen={bookingModal} onClose={() => setBookingModal(false)} title="Book Tests for Patient" size="lg">
        <form onSubmit={handleSaveBooking} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Patient</label>
            <select value={bookingForm.patient} onChange={(e) => setBookingForm({ ...bookingForm, patient: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" required>
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Select Tests</label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-50">
              {tests.filter(t => t.isActive).map(t => (
                <label key={t._id} className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2.5">
                    <input type="checkbox" checked={bookingForm.testIds.includes(t._id)} onChange={() => toggleTest(t._id)}
                      className="w-4 h-4 rounded accent-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.code}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-blue-600">&#8377;{t.price.toLocaleString('en-IN')}</span>
                </label>
              ))}
            </div>
            {bookingForm.testIds.length > 0 && (
              <div className="mt-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center">
                <span className="text-sm text-blue-700 font-medium">{bookingForm.testIds.length} test(s) selected</span>
                <span className="text-base font-bold text-blue-700">Net: &#8377;{netTotal.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Discount (&#8377;)</label>
              <input type="number" value={bookingForm.discount}
                onChange={(e) => setBookingForm({ ...bookingForm, discount: e.target.value })} min="0"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Amount Paid (&#8377;)</label>
              <input type="number" value={bookingForm.amountPaid}
                onChange={(e) => setBookingForm({ ...bookingForm, amountPaid: e.target.value })} min="0"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Payment Status</label>
              <select value={bookingForm.paymentStatus} onChange={(e) => setBookingForm({ ...bookingForm, paymentStatus: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50">
                {['pending', 'paid', 'partial'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Payment Mode</label>
              <select value={bookingForm.paymentMode} onChange={(e) => setBookingForm({ ...bookingForm, paymentMode: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50">
                {['cash', 'card', 'upi', 'insurance', 'online'].map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <FlaskConical size={16} />}
              {saving ? 'Booking...' : 'Book Tests'}
            </button>
            <button type="button" onClick={() => setBookingModal(false)}
              className="px-6 border border-slate-200 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
