import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { renderLatex } from '../utils/latex';
import type { TransferFunctionNodeData } from '../types';

export function TransferFunctionNode({ data, selected }: NodeProps<TransferFunctionNodeData>) {
  return (
    <div className={`border-2 rounded px-3 py-1.5 min-w-[72px] text-center shadow-sm select-none ${selected ? 'border-blue-500' : 'border-slate-700'}`} style={{ backgroundColor: data.color ?? '#ffffff' }}>
      <Handle type="target" position={Position.Left} />
      <div
        className="text-xs text-slate-800"
        dangerouslySetInnerHTML={{ __html: renderLatex(`\\dfrac{${data.numerator ?? '1'}}{${data.denominator ?? 's+1'}}`) }}
      />
      {data.label && <div className="text-[10px] text-slate-400 mt-0.5">{data.label}</div>}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
