import { useContext } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { NodeEditContext } from '../context/NodeEditContext';
import type { ModuleNodeData } from '../types';

const HANDLE_SPACING = 28;
const PADDING_TOP = 36;
const PADDING_BOTTOM = 20;
const DEFAULT_WIDTH = 140;

function defaultHeight(inputCount: number, outputCount: number) {
  return PADDING_TOP + Math.max(inputCount, outputCount) * HANDLE_SPACING + PADDING_BOTTOM;
}

function handleTop(index: number, count: number, totalHeight: number) {
  const usable = totalHeight - PADDING_TOP - PADDING_BOTTOM;
  const step = usable / count;
  return PADDING_TOP + step * index + step / 2;
}

export function ModuleNode({ id, data, selected, style }: NodeProps<ModuleNodeData>) {
  const openEdit = useContext(NodeEditContext);

  const inputCount = Math.max(1, data.inputCount ?? 1);
  const outputCount = Math.max(1, data.outputCount ?? 1);

  const width = (style?.width as number) ?? DEFAULT_WIDTH;
  const height = (style?.height as number) ?? defaultHeight(inputCount, outputCount);

  return (
    <>
      <NodeResizer
        minWidth={80}
        minHeight={defaultHeight(inputCount, outputCount)}
        isVisible={selected}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 1 }}
        handleStyle={{ backgroundColor: '#3b82f6', width: 8, height: 8, borderRadius: 2 }}
      />
      <div
        className={`border-4 rounded-lg shadow-md select-none relative ${selected ? 'border-blue-500' : 'border-slate-700'}`}
        style={{ width, height, backgroundColor: data.color ?? '#ffffff' }}
      >
        {/* Input handles — pixel-positioned */}
        {Array.from({ length: inputCount }, (_, i) => (
          <Handle
            key={`in${i}`}
            type="target"
            position={Position.Left}
            id={`in${i}`}
            style={{ top: handleTop(i, inputCount, height), transform: 'translateY(-50%)' }}
          />
        ))}

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-3">
          <div className="text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">module</div>
          <div className="text-sm font-semibold text-slate-800 text-center leading-tight">{data.label || 'Module'}</div>
        </div>

        {/* Edit button */}
        <button
          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Edit module"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); openEdit(id); }}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
            <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086zM11.189 6.25 9.75 4.81l-6.286 6.287a.25.25 0 0 0-.064.108l-.558 1.953 1.953-.558a.25.25 0 0 0 .108-.064l6.286-6.286z"/>
          </svg>
        </button>

        {/* Output handles — pixel-positioned */}
        {Array.from({ length: outputCount }, (_, i) => (
          <Handle
            key={`out${i}`}
            type="source"
            position={Position.Right}
            id={`out${i}`}
            style={{ top: handleTop(i, outputCount, height), transform: 'translateY(-50%)' }}
          />
        ))}
      </div>
    </>
  );
}
