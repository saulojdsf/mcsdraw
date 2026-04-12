import { Handle, Position, NodeResizer } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { CustomTextNodeData } from '../types';

const HANDLE_SPACING = 26;
const PADDING_V = 14;

function nodeHeight(count: number) {
  return Math.max(52, PADDING_V * 2 + count * HANDLE_SPACING);
}

function handleTop(index: number, count: number, height: number) {
  if (count === 0) return height / 2;
  const usable = height - PADDING_V * 2;
  const step = usable / count;
  return PADDING_V + step * index + step / 2;
}

export function CustomTextNode({ data, selected }: NodeProps<CustomTextNodeData>) {
  const inputCount = data.inputCount ?? 1;
  const outputCount = data.outputCount ?? 1;
  const height = nodeHeight(Math.max(inputCount, outputCount));

  return (
    <>
      <NodeResizer
        minWidth={64}
        minHeight={height}
        isVisible={selected}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 1 }}
        handleStyle={{ backgroundColor: '#3b82f6', width: 8, height: 8, borderRadius: 2 }}
      />
      <div
        className={`w-full h-full border-2 rounded px-4 py-2 text-center shadow-sm select-none flex flex-col items-center justify-center relative ${selected ? 'border-blue-500' : 'border-slate-700'}`}
        style={{ backgroundColor: data.color ?? '#ffffff', minHeight: height }}
      >
        {/* Input handles */}
        {Array.from({ length: inputCount }).map((_, i) => (
          <Handle
            key={`in${i}`}
            type="target"
            position={Position.Left}
            id={`in${i}`}
            style={
              inputCount === 1
                ? { top: '50%', transform: 'translateY(-50%)' }
                : { top: handleTop(i, inputCount, height), transform: 'translateY(-50%)' }
            }
          />
        ))}

        <div className="text-sm text-slate-800 whitespace-pre-wrap">{data.text || 'Text'}</div>
        {data.label && <div className="text-[10px] text-slate-400 mt-0.5">{data.label}</div>}

        {/* Output handles */}
        {Array.from({ length: outputCount }).map((_, i) => (
          <Handle
            key={`out${i}`}
            type="source"
            position={Position.Right}
            id={`out${i}`}
            style={
              outputCount === 1
                ? { top: '50%', transform: 'translateY(-50%)' }
                : { top: handleTop(i, outputCount, height), transform: 'translateY(-50%)' }
            }
          />
        ))}
      </div>
    </>
  );
}
