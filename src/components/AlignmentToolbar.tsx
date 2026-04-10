import type { AlignType } from '../hooks/useAlignment';

interface AlignmentToolbarProps {
  nodeCount: number;
  onAlign: (type: AlignType) => void;
}

interface BtnProps {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

function Btn({ title, onClick, children, disabled }: BtnProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
    >
      {children}
    </button>
  );
}

export function AlignmentToolbar({ nodeCount, onAlign }: AlignmentToolbarProps) {
  if (nodeCount < 2) return null;

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg shadow-md px-2 py-1">
      <span className="text-[9px] uppercase tracking-widest text-slate-400 mr-1.5 font-semibold select-none">Align</span>

      <Btn title="Align left edges" onClick={() => onAlign('left')}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <line x1="2" y1="1" x2="2" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="2" y="2" width="8" height="3" rx="0.5" fill="currentColor"/>
          <rect x="2" y="9" width="5" height="3" rx="0.5" fill="currentColor"/>
        </svg>
      </Btn>

      <Btn title="Align right edges" onClick={() => onAlign('right')}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <line x1="12" y1="1" x2="12" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="2" y="2" width="10" height="3" rx="0.5" fill="currentColor"/>
          <rect x="7" y="9" width="5" height="3" rx="0.5" fill="currentColor"/>
        </svg>
      </Btn>

      <Btn title="Align top edges" onClick={() => onAlign('top')}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <line x1="1" y1="2" x2="13" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="2" y="2" width="3" height="8" rx="0.5" fill="currentColor"/>
          <rect x="9" y="2" width="3" height="5" rx="0.5" fill="currentColor"/>
        </svg>
      </Btn>

      <Btn title="Align bottom edges" onClick={() => onAlign('bottom')}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <line x1="1" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="2" y="2" width="3" height="10" rx="0.5" fill="currentColor"/>
          <rect x="9" y="7" width="3" height="5" rx="0.5" fill="currentColor"/>
        </svg>
      </Btn>

      <div className="w-px h-5 bg-slate-200 mx-0.5" />

      <Btn title="Center on horizontal axis" onClick={() => onAlign('centerH')}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1"/>
          <rect x="2" y="3" width="3" height="8" rx="0.5" fill="currentColor"/>
          <rect x="9" y="4" width="3" height="6" rx="0.5" fill="currentColor"/>
        </svg>
      </Btn>

      <Btn title="Center on vertical axis" onClick={() => onAlign('centerV')}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1"/>
          <rect x="2" y="2" width="10" height="3" rx="0.5" fill="currentColor"/>
          <rect x="3" y="9" width="8" height="3" rx="0.5" fill="currentColor"/>
        </svg>
      </Btn>

      <div className="w-px h-5 bg-slate-200 mx-0.5" />

      <Btn title="Distribute horizontally" onClick={() => onAlign('distributeH')} disabled={nodeCount < 3}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <line x1="1" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="13" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="5" y="4" width="4" height="6" rx="0.5" fill="currentColor"/>
        </svg>
      </Btn>

      <Btn title="Distribute vertically" onClick={() => onAlign('distributeV')} disabled={nodeCount < 3}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <line x1="1" y1="1" x2="13" y2="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="1" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="4" y="5" width="6" height="4" rx="0.5" fill="currentColor"/>
        </svg>
      </Btn>
    </div>
  );
}
