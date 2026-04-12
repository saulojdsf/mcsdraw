import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { renderLatex } from '../utils/latex';
import type { IntegratorNodeData } from '../types';

export function IntegratorNode({ data, selected }: NodeProps<IntegratorNodeData>) {
  const inputPos = data.flipped ? Position.Right : Position.Left;
  const outputPos = data.flipped ? Position.Left : Position.Right;
  return (
    <div className={`border-2 rounded px-4 py-2 min-w-[64px] text-center shadow-sm select-none ${selected ? 'border-blue-500' : 'border-slate-700'}`} style={{ backgroundColor: data.color ?? '#ffffff' }}>
      <Handle type="target" position={inputPos} />
      <div className="text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: renderLatex('\\dfrac{1}{s}') }} />
      {data.label && <div className="text-[10px] text-slate-400 mt-0.5">{data.label}</div>}
      <Handle type="source" position={outputPos} />
    </div>
  );
}
