import { NodeResizer } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { GroupRectNodeData } from '../types';

export function GroupRectNode({ data, selected }: NodeProps<GroupRectNodeData>) {
  return (
    <>
      <NodeResizer
        minWidth={80}
        minHeight={60}
        isVisible={selected}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 1 }}
        handleStyle={{ backgroundColor: '#3b82f6', width: 8, height: 8, borderRadius: 2 }}
      />
      <div
        className="w-full h-full rounded relative select-none"
        style={{
          border: `2px dashed ${selected ? '#3b82f6' : '#64748b'}`,
          backgroundColor: data.color ?? 'rgba(241, 245, 249, 0.4)',
        }}
      >
        {data.label && (
          <span
            className="absolute left-2 top-1 text-xs font-semibold text-slate-500 leading-none bg-slate-50 px-1 rounded"
          >
            {data.label}
          </span>
        )}
      </div>
    </>
  );
}
