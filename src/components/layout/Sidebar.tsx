import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserRound,
  Stethoscope,
  FlaskConical,
  Receipt,
  Pill,
  BarChart3,
  RotateCcw,
  ClipboardList,
  UserCog,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  module?: string;
}

interface NavGroup {
  key: string;
  group: string;
  groupIcon: LucideIcon;
  items: NavItem[];
}

const singleItem: NavItem = { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' };

const navGroups: NavGroup[] = [
  {
    key: 'administration',
    group: 'Administration',
    groupIcon: Building2,
    items: [
      { to: '/cities',   label: 'Cities',      icon: Building2, module: 'cities'      },
      { to: '/users',    label: 'Admin Users', icon: Users,     module: 'admin_users' },
      { to: '/doctors',  label: 'Doctors',     icon: UserCog,   module: 'doctors'     },
    ],
  },
  {
    key: 'services',
    group: 'Services',
    groupIcon: Stethoscope,
    items: [
      { to: '/patients',  label: 'Patients',    icon: UserRound,   module: 'patients'  },
      { to: '/opd',             label: 'OPD Visits',      icon: Stethoscope,   module: 'opd'            },
      { to: '/regular-checkup', label: 'Regular Checkup', icon: ClipboardList, module: 'regular_checkup' },
      { to: '/pathology',       label: 'Pathology',       icon: FlaskConical,  module: 'pathology'      },
    ],
  },
  {
    key: 'medical',
    group: 'Medical Store',
    groupIcon: Pill,
    items: [
      { to: '/billing',  label: 'Billing (POS)',   icon: Receipt, module: 'billing'        },
      { to: '/medicine', label: 'Medicine Stock',  icon: Pill,    module: 'medicine_stock' },
    ],
  },
  {
    key: 'analytics',
    group: 'Analytics',
    groupIcon: BarChart3,
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3, module: 'reports' },
      { to: '/returns', label: 'Returns', icon: RotateCcw, module: 'returns' },
    ],
  },
];

export function Sidebar() {
  const { hasPermission, isSuperAdmin } = useAuthStore();
  const location = useLocation();

  const isVisible = (item: NavItem) => {
    if (isSuperAdmin()) return true;
    if (!item.module) return true;
    return hasPermission(item.module, 'view');
  };

  // Determine which group key contains the current route
  const activeGroupKey = navGroups.find(g =>
    g.items.some(item => location.pathname === item.to)
  )?.key ?? null;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach(g => { initial[g.key] = g.key === activeGroupKey; });
    return initial;
  });

  // When route changes, ensure the active group is open
  useEffect(() => {
    if (activeGroupKey) {
      setOpenGroups(prev => ({ ...prev, [activeGroupKey]: true }));
    }
  }, [activeGroupKey]);

  const toggle = (key: string) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <aside
      className="w-64 flex flex-col shrink-0"
      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 shrink-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight tracking-wide">Sunrise IVF Center</p>
          <p className="text-slate-400 text-xs mt-0.5">IVF Center</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-1">
        {/* Dashboard – always visible, no dropdown */}
        {isVisible(singleItem) && (
          <NavLink
            to={singleItem.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <LayoutDashboard size={17} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-white' : 'text-slate-500'} />
                <span>Dashboard</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
              </>
            )}
          </NavLink>
        )}

        {/* Accordion groups */}
        {navGroups.map((group) => {
          const visible = group.items.filter(isVisible);
          if (visible.length === 0) return null;

          const isOpen = openGroups[group.key] ?? false;
          const hasActive = visible.some(item => location.pathname === item.to);
          const GroupIcon = group.groupIcon;

          return (
            <div key={group.key} className="flex flex-col">
              {/* Group header button */}
              <button
                onClick={() => toggle(group.key)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left ${
                  hasActive && !isOpen
                    ? 'bg-blue-600/20 text-blue-300'
                    : isOpen
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/8'
                }`}
              >
                <GroupIcon
                  size={17}
                  strokeWidth={1.8}
                  className={hasActive && !isOpen ? 'text-blue-400' : isOpen ? 'text-slate-300' : 'text-slate-500'}
                />
                <span className="flex-1 truncate">{group.group}</span>
                {hasActive && !isOpen && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mr-1" />
                )}
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className={`shrink-0 transition-transform duration-200 text-slate-500 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown items */}
              <div
                className="overflow-hidden transition-all duration-200 ease-in-out"
                style={{ maxHeight: isOpen ? `${visible.length * 48}px` : '0px' }}
              >
                <div className="pl-3 pt-0.5 pb-1 flex flex-col gap-0.5">
                  {/* Vertical connector line */}
                  <div className="relative">
                    <div className="absolute left-2.5 top-0 bottom-0 w-px bg-white/10" />
                    {visible.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) =>
                            `relative flex items-center gap-3 pl-7 pr-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                                : 'text-slate-400 hover:text-white hover:bg-white/8'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {/* Horizontal tick from connector */}
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-px bg-white/10" />
                              <Icon
                                size={15}
                                strokeWidth={isActive ? 2.2 : 1.8}
                                className={isActive ? 'text-white shrink-0' : 'text-slate-500 shrink-0'}
                              />
                              <span className="truncate">{item.label}</span>
                              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />}
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-slate-400 text-xs">System Online</span>
          <span className="ml-auto text-slate-600 text-xs">v1.0</span>
        </div>
      </div>
    </aside>
  );
}
