import { Handle, Position, NodeResizer } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { CustomTextNodeData } from '../types';

export function CustomTextNode({ data, selected }: NodeProps<CustomTextNodeData>) {
  return (
    <>
      <NodeResizer
        minWidth={64}
        minHeight={36}
        isVisible={selected}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 1 }}
        handleStyle={{ backgroundColor: '#3b82f6', width: 8, height: 8, borderRadius: 2 }}
      />
      <div className={`w-full h-full border-2 rounded px-4 py-2 text-center shadow-sm select-none flex flex-col items-center justify-center ${selected ? 'border-blue-500' : 'border-slate-700'}`} style={{ backgroundColor: data.color ?? '#ffffff' }}>
        <Handle type="target" position={Position.Left} />
        <div className="text-sm text-slate-800 whitespace-pre-wrap">{data.text || 'Text'}</div>
        {data.label && <div className="text-[10px] text-slate-400 mt-0.5">{data.label}</div>}
        <Handle type="source" position={Position.Right} />
      </div>
    </>
  );
}
