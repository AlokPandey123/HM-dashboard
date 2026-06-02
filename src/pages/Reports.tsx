import { useEffect, useState } from 'react';
import { Stethoscope, FlaskConical, Receipt, RotateCcw, BarChart3 } from 'lucide-react';
import api from '../api/axios';
import { Table } from '../components/Table';

interface TestBooking { _id: string; bookingId: string; patient: { name: string; patientId: string; age: number; gender: string }; tests: { test: { name: string; code: string; normalRange: string }; status: string; result: string; completedAt: string }[]; bookedDate: string; paymentStatus: string; }
interface Patient { _id: string; name: string; patientId: string; }
interface PatientReport { patient: { name: string; patientId: string; age: number; gender: string; phone: string }; opds: unknown[]; testBookings: TestBooking[]; bills: unknown[]; returns: unknown[]; }

const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', processing: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

export function Reports() {
  const [activeTab, setActiveTab] = useState<'tests' | 'patient' | 'revenue'>('tests');
  const [testReports, setTestReports] = useState<TestBooking[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientReport, setPatientReport] = useState<PatientReport | null>(null);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [revenue, setRevenue] = useState<{ _id: string; total: number; paid: number; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ startDate: '', endDate: '', status: '' });
  const [revenueFilter, setRevenueFilter] = useState({ startDate: '', endDate: '', groupBy: 'day' });
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/patients', { params: { all: true } }).then(r => setPatients(Array.isArray(r.data.data) ? r.data.data : []));
  }, []);

  const loadTestReports = async () => {
    setLoading(true);
    try {
      const r = await api.get('/reports/tests', { params: { ...filter, page, limit: 30 } });
      setTestReports(r.data.data.bookings);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadTestReports(); }, [page]);

  const loadPatientReport = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      const r = await api.get(`/reports/patient/${selectedPatient}`);
      setPatientReport(r.data.data);
    } finally { setLoading(false); }
  };

  const loadRevenue = async () => {
    setLoading(true);
    try {
      const r = await api.get('/reports/revenue', { params: revenueFilter });
      setRevenue(r.data.data);
    } finally { setLoading(false); }
  };

  const testColumns = [
    { key: 'bookingId', label: 'Booking ID' },
    { key: 'patient', label: 'Patient', render: (r: TestBooking) => `${r.patient?.name} (${r.patient?.patientId})` },
    { key: 'tests', label: 'Tests', render: (r: TestBooking) => (
      <div className="space-y-1">
        {r.tests.map((t, i) => (
          <div key={i} className="text-xs">
            <span className="font-medium">{t.test?.name}</span>
            <span className={`ml-2 px-1.5 py-0.5 rounded-full ${statusColors[t.status]}`}>{t.status}</span>
            {t.result && <span className="ml-2 text-slate-600">Result: {t.result}</span>}
          </div>
        ))}
      </div>
    )},
    { key: 'bookedDate', label: 'Date', render: (r: TestBooking) => new Date(r.bookedDate).toLocaleDateString('en-IN') },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
          <BarChart3 size={13} /> Patient-wise test reports &amp; revenue analytics
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['tests', 'patient', 'revenue'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {tab === 'tests' ? 'Test Reports' : tab === 'patient' ? 'Patient Report' : 'Revenue Report'}
          </button>
        ))}
      </div>

      {activeTab === 'tests' && (
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4 flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-1">From Date</label>
              <input type="date" value={filter.startDate} onChange={(e) => setFilter({ ...filter, startDate: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">To Date</label>
              <input type="date" value={filter.endDate} onChange={(e) => setFilter({ ...filter, endDate: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => setPage(1)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Search</button>
          </div>
          <Table columns={testColumns} data={testReports} loading={loading} />
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500">Showing {testReports.length === 0 ? 0 : Math.min((page-1)*30+1, (testReports as any).total || (testReports.length))}–{Math.min(page*30, (testReports as any).total || (testReports.length))} of {(testReports as any).total || '—'}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-40">Prev</button>
              <button disabled={testReports.length < 30} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'patient' && (
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4 flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">Select Patient</label>
              <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Patient</option>
                {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
              </select>
            </div>
            <button onClick={loadPatientReport} disabled={!selectedPatient} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">View Report</button>
          </div>

          {patientReport && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h3 className="font-semibold text-slate-900 mb-3">Patient Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  {[['Name', patientReport.patient.name], ['Patient ID', patientReport.patient.patientId], ['Age', `${patientReport.patient.age} yrs`], ['Gender', patientReport.patient.gender], ['Phone', patientReport.patient.phone]].map(([l, v]) => (
                    <div key={l}><p className="text-slate-500 text-xs">{l}</p><p className="font-medium capitalize">{v}</p></div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'OPD Visits',    value: patientReport.opds.length,         Icon: Stethoscope, iconCls: 'bg-blue-50 text-blue-500'   },
                  { label: 'Test Bookings', value: patientReport.testBookings.length,  Icon: FlaskConical, iconCls: 'bg-purple-50 text-purple-500' },
                  { label: 'Bills',         value: patientReport.bills.length,         Icon: Receipt,     iconCls: 'bg-emerald-50 text-emerald-500' },
                  { label: 'Returns',       value: patientReport.returns.length,       Icon: RotateCcw,   iconCls: 'bg-orange-50 text-orange-500' },
                ].map(({ label, value, Icon, iconCls }) => (
                  <div key={label} className="bg-white rounded-xl p-4 border border-slate-100 text-center">
                    <div className={`w-10 h-10 rounded-xl ${iconCls} flex items-center justify-center mx-auto mb-2`}>
                      <Icon size={20} />
                    </div>
                    <p className="text-xl font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
              {patientReport.testBookings.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                  <h3 className="font-semibold text-slate-900 mb-3">Test History</h3>
                  <div className="space-y-3">
                    {patientReport.testBookings.map((b) => (
                      <div key={b._id} className="border border-slate-100 rounded-lg p-3">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">{b.bookingId}</span>
                          <span className="text-xs text-slate-500">{new Date(b.bookedDate).toLocaleDateString('en-IN')}</span>
                        </div>
                        {b.tests.map((t, i) => (
                          <div key={i} className="text-xs flex items-center gap-2 py-1 border-t border-slate-50">
                            <span className="font-medium">{t.test?.name}</span>
                            <span className={`px-1.5 py-0.5 rounded-full ${statusColors[t.status]}`}>{t.status}</span>
                            {t.result && <span className="text-slate-600">→ {t.result}</span>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'revenue' && (
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4 flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-1">From Date</label>
              <input type="date" value={revenueFilter.startDate} onChange={(e) => setRevenueFilter({ ...revenueFilter, startDate: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">To Date</label>
              <input type="date" value={revenueFilter.endDate} onChange={(e) => setRevenueFilter({ ...revenueFilter, endDate: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Group By</label>
              <select value={revenueFilter.groupBy} onChange={(e) => setRevenueFilter({ ...revenueFilter, groupBy: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="day">Daily</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
            <button onClick={loadRevenue} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Generate</button>
          </div>

          {revenue.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Period</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Total Bills</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Total Amount</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Amount Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {revenue.map((r) => (
                    <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{r._id}</td>
                      <td className="px-4 py-3 text-right">{r.count}</td>
                      <td className="px-4 py-3 text-right">₹{r.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">₹{r.paid.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{revenue.reduce((s, r) => s + r.count, 0)}</td>
                    <td className="px-4 py-3 text-right">₹{revenue.reduce((s, r) => s + r.total, 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-600">₹{revenue.reduce((s, r) => s + r.paid, 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
