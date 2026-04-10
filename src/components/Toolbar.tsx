import type { BlockNodeType } from '../types';
import { blockLabels } from '../types';
import { renderLatex } from '../utils/latex';

interface ToolbarBlockProps {
  type: BlockNodeType;
  preview: string;
  isLatex?: boolean;
  isSvg?: 'triangle' | 'switch' | 'textLabel' | 'groupRect';
}

function ToolbarBlock({ type, preview, isLatex, isSvg }: ToolbarBlockProps) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/reactflow/type', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const content = isSvg === 'triangle' ? (
    <svg width="36" height="28">
      <polygon points="2,2 34,14 2,26" fill="white" stroke="#334155" strokeWidth="2" strokeLinejoin="round" />
      <text x="14" y="14" textAnchor="middle" dominantBaseline="middle" fontSize="10" fontFamily="monospace" fontWeight="600" fill="#1e293b">K</text>
    </svg>
  ) : isSvg === 'switch' ? (
    <svg width="36" height="28">
      <rect x={1} y={1} width={34} height={26} rx={2} fill="white" stroke="#334155" strokeWidth="1.5" />
      <circle cx={7} cy={14} r={2} fill="#334155" />
      <circle cx={29} cy={14} r={2} fill="#334155" />
      <line x1={7} y1={14} x2={27} y2={8} stroke="#334155" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  ) : isSvg === 'textLabel' ? (
    <svg width="36" height="28">
      <text x="18" y="15" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontFamily="sans-serif" fill="#1e293b">Aa</text>
    </svg>
  ) : isSvg === 'groupRect' ? (
    <svg width="36" height="28">
      <rect x={2} y={2} width={32} height={24} rx={3} fill="rgba(241,245,249,0.6)" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 3" />
    </svg>
  ) : isLatex ? (
    <span dangerouslySetInnerHTML={{ __html: renderLatex(preview) }} />
  ) : (
    <span>{preview}</span>
  );

  return (
    <div
      className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing select-none group"
      draggable
      onDragStart={onDragStart}
      title={`Drag to add ${blockLabels[type]}`}
    >
      <div
        className={`w-full flex items-center justify-center rounded border-2 px-1 py-1.5 transition-all group-hover:scale-105 group-hover:shadow-md bg-white text-xs font-mono ${blockStyles[type]}`}
        style={{ minHeight: 36 }}
      >
        {content}
      </div>
      <span className="text-[10px] text-slate-300 text-center leading-tight">{blockLabels[type]}</span>
    </div>
  );
}

const blockStyles: Record<BlockNodeType, string> = {
  gainNode: 'border-slate-700 bg-white text-slate-800',
  triangleNode: 'border-0 bg-transparent',
  integratorNode: 'border-slate-700 bg-white text-slate-800',
  derivativeNode: 'border-slate-700 bg-white text-slate-800',
  sumNode: 'border-slate-700 bg-white text-slate-800 rounded-3xl',
  multiplyNode: 'border-slate-700 bg-white text-slate-800 rounded-3xl',
  divideNode: 'border-slate-700 bg-white text-slate-800 rounded-3xl',
  transferFunctionNode: 'border-slate-700 bg-white text-slate-800',
  customTextNode: 'border-slate-700 bg-white text-slate-800',
  customLatexNode: 'border-slate-700 bg-white text-slate-800',
  moduleNode: 'border-4 border-slate-700 bg-white text-slate-800 font-semibold',
  switchNode: 'border-0 bg-transparent',
  textLabelNode: 'border-0 bg-transparent text-slate-800',
  groupRectNode: 'border-0 bg-transparent',
};

const blocks: Array<{ type: BlockNodeType; preview: string; isLatex?: boolean; isSvg?: 'triangle' | 'switch' | 'textLabel' | 'groupRect' }> = [
  { type: 'gainNode', preview: 'K' },
  { type: 'triangleNode', preview: '', isSvg: 'triangle' },
  { type: 'integratorNode', preview: '\\dfrac{1}{s}', isLatex: true },
  { type: 'derivativeNode', preview: 's', isLatex: true },
  { type: 'sumNode', preview: '∑' },
  { type: 'multiplyNode', preview: '×' },
  { type: 'divideNode', preview: '÷' },
  { type: 'transferFunctionNode', preview: '\\dfrac{N}{D}', isLatex: true },
  { type: 'customTextNode', preview: 'Abc' },
  { type: 'customLatexNode', preview: '\\LaTeX', isLatex: true },
  { type: 'moduleNode', preview: 'MOD' },
  { type: 'switchNode', preview: '', isSvg: 'switch' },
  { type: 'textLabelNode', preview: '', isSvg: 'textLabel' },
  { type: 'groupRectNode', preview: '', isSvg: 'groupRect' },
];

export function Toolbar() {
  return (
    <div className="w-28 flex flex-col gap-3 p-3 bg-slate-800 border-r border-slate-700 overflow-y-auto">
      <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold pt-1 pb-0.5 border-b border-slate-700">
        Blocks
      </div>
      {blocks.map((b) => (
        <ToolbarBlock key={b.type} type={b.type} preview={b.preview} isLatex={b.isLatex} isSvg={b.isSvg} />
      ))}
      <div className="text-[9px] text-slate-500 mt-2 text-center">Drag to canvas</div>
    </div>
  );
}
