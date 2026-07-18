import { useEffect, useState } from 'react';
import { Users, Hospital, DollarSign, FlaskConical, AlertTriangle, Plus, Stethoscope, CreditCard, BarChart3, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { StatsCard } from '../components/StatsCard';

interface Stats {
  patients: { total: number; today: number };
  opd: { total: number; today: number };
  billing: { total: number; todayRevenue: number };
  tests: { pending: number; completed: number };
  medicine: { lowStock: number };
}

const quickActions = [
  { label: 'Add Patient',    icon: Plus,        path: '/patients', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100' },
  { label: 'New OPD',        icon: Stethoscope, path: '/opd',      color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100' },
  { label: 'Create Bill',    icon: CreditCard,  path: '/billing',  color: 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-100' },
  { label: 'Book Test',      icon: FlaskConical,path: '/pathology',color: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-100' },
  { label: 'View Reports',   icon: BarChart3,   path: '/reports',  color: 'bg-teal-50 text-teal-600 hover:bg-teal-100 border-teal-100' },
  { label: 'Process Return', icon: RotateCcw,   path: '/returns',  color: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100' },
];

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then((r) => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time hospital management metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Patients"
          value={stats?.patients.total ?? 0}
          icon={Users}
          color="blue"
          sub={`+${stats?.patients.today ?? 0} registered today`}
        />
        <StatsCard
          title="OPD Visits"
          value={stats?.opd.total ?? 0}
          icon={Hospital}
          color="green"
          sub={`${stats?.opd.today ?? 0} visits today`}
        />
        <StatsCard
          title="Today's Revenue"
          value={`₹${(stats?.billing.todayRevenue ?? 0).toLocaleString('en-IN')}`}
          icon={DollarSign}
          color="orange"
          sub={`${stats?.billing.total ?? 0} total bills`}
        />
        <StatsCard
          title="Pending Tests"
          value={stats?.tests.pending ?? 0}
          icon={FlaskConical}
          color="purple"
          sub={`${stats?.tests.completed ?? 0} completed`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.path}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all text-center ${action.color}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                  <span className="text-xs font-semibold leading-tight">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* System Info + Low Stock */}
        <div className="flex flex-col gap-4">
          {stats && stats.medicine.lowStock > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-800">{stats.medicine.lowStock} Low Stock Alert{stats.medicine.lowStock > 1 ? 's' : ''}</p>
                <p className="text-xs text-red-500 mt-0.5">Medicines below minimum stock threshold</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex-1">
            <h2 className="font-bold text-slate-900 mb-4">System Info</h2>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Version',          value: 'Sunrise IVF Center v1.0.0',          valueClass: 'text-slate-700' },
                { label: 'Return Deduction', value: '20% deduction',       valueClass: 'text-orange-600 font-semibold' },
                { label: 'Payment Gateway',  value: 'Stripe Enabled',      valueClass: 'text-emerald-600 font-semibold' },
                { label: 'Date',             value: new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' }), valueClass: 'text-slate-700' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-slate-400 text-xs">{row.label}</span>
                  <span className={`text-xs ${row.valueClass}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
