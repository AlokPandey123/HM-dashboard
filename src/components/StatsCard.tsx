import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon | string;
  color?: string;
  sub?: string;
  trend?: { value: string; up: boolean };
}

const colorMap: Record<string, { gradient: string; text: string; iconBg: string }> = {
  blue:   { gradient: 'from-blue-500 to-blue-600',     text: 'text-blue-50',   iconBg: 'bg-blue-400/30'   },
  green:  { gradient: 'from-emerald-500 to-teal-600',  text: 'text-emerald-50',iconBg: 'bg-emerald-400/30'},
  purple: { gradient: 'from-violet-500 to-purple-600', text: 'text-violet-50', iconBg: 'bg-violet-400/30' },
  orange: { gradient: 'from-orange-400 to-rose-500',   text: 'text-orange-50', iconBg: 'bg-orange-400/30' },
  red:    { gradient: 'from-red-500 to-rose-600',      text: 'text-red-50',    iconBg: 'bg-red-400/30'    },
  teal:   { gradient: 'from-teal-500 to-cyan-600',     text: 'text-teal-50',   iconBg: 'bg-teal-400/30'   },
};

export function StatsCard({ title, value, icon: Icon, color = 'blue', sub, trend }: Props) {
  const c = colorMap[color] ?? colorMap.blue;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.gradient} p-5 shadow-lg shadow-slate-200/60`}>
      {/* Decorative circle */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-2 w-16 h-16 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${c.text} opacity-80`}>{title}</p>
          <p className="text-3xl font-bold text-white mt-1 leading-none">{value}</p>
          {sub && <p className={`text-xs mt-2 ${c.text} opacity-70`}>{sub}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-semibold ${trend.up ? 'text-emerald-200' : 'text-red-200'}`}>
                {trend.up ? '▲' : '▼'} {trend.value}
              </span>
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0`}>
          {typeof Icon === 'string' ? (
            <span className="text-xl">{Icon}</span>
          ) : (
            <Icon size={22} className="text-white" strokeWidth={1.8} />
          )}
        </div>
      </div>
    </div>
  );
}
