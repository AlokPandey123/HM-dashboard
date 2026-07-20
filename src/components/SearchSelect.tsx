import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

interface Item { _id: string; label: string; sublabel?: string; }

interface Props {
  label: string;
  value: string;
  displayValue: string;
  onSelect: (item: Item | null) => void;
  onSearch: (q: string) => Promise<Item[]>;
  placeholder?: string;
  required?: boolean;
}

export function SearchSelect({ label, value, displayValue, onSelect, onSearch, placeholder = 'Search…', required }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await onSearch(query));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => { setQuery(''); setOpen(true); };
  const handleSelect = (item: Item) => { onSelect(item); setOpen(false); setQuery(''); };
  const handleClear = (e: React.MouseEvent) => { e.stopPropagation(); onSelect(null); setQuery(''); };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {open ? (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full border border-blue-400 rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm bg-white hover:bg-slate-50 transition-colors ${value ? 'border-slate-300 text-slate-800' : 'border-slate-300 text-slate-400'}`}
        >
          <span className="truncate text-left">{value ? displayValue : placeholder}</span>
          <span className="flex items-center gap-1 shrink-0 ml-2">
            {value && (
              <span onClick={handleClear} className="text-slate-400 hover:text-red-500 transition-colors">
                <X size={13} />
              </span>
            )}
            <ChevronDown size={14} className="text-slate-400" />
          </span>
        </button>
      )}

      {required && <input tabIndex={-1} required value={value} onChange={() => {}} className="sr-only" />}

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-400 text-center">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400 text-center">No results found</div>
          ) : results.map((item) => (
            <button key={item._id} type="button" onMouseDown={() => handleSelect(item)}
              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0">
              <div className="text-sm font-medium text-slate-800">{item.label}</div>
              {item.sublabel && <div className="text-xs text-slate-400">{item.sublabel}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
