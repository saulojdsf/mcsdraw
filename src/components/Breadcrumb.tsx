import type { NavItem } from '../types';

interface BreadcrumbProps {
  navStack: NavItem[];
  onNavigate: (index: number) => void;
}

export function Breadcrumb({ navStack, onNavigate }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-slate-800 text-sm border-b border-slate-700">
      {navStack.map((item, index) => (
        <span key={item.id} className="flex items-center gap-1">
          {index > 0 && <span className="text-slate-500">›</span>}
          <button
            onClick={() => onNavigate(index)}
            className={`px-2 py-0.5 rounded transition-colors ${
              index === navStack.length - 1
                ? 'text-white font-semibold cursor-default'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            {item.label}
          </button>
        </span>
      ))}
    </div>
  );
}
