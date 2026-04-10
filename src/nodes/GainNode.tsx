import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { GainNodeData } from '../types';

export function GainNode({ data, selected }: NodeProps<GainNodeData>) {
  return (
    <div className={`border-2 rounded px-4 py-2 min-w-[64px] text-center shadow-sm select-none ${selected ? 'border-blue-500' : 'border-slate-700'}`} style={{ backgroundColor: data.color ?? '#ffffff' }}>
      <Handle type="target" position={Position.Left} />
      <div className="text-base font-mono font-semibold text-slate-800">{data.gain || 'K'}</div>
      {data.label && <div className="text-[10px] text-slate-400 mt-0.5">{data.label}</div>}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
