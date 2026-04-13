import { Handle, Position, NodeResizer } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { CustomTextNodeData } from '../types';

const HANDLE_SPACING = 26;
const PADDING_V = 14;

function nodeHeight(count: number) {
  return Math.max(52, PADDING_V * 2 + count * HANDLE_SPACING);
}

function handleTopPct(index: number, count: number): string {
  return `${((index + 0.5) / count) * 100}%`;
}

export function CustomTextNode({ data, selected }: NodeProps<CustomTextNodeData>) {
  const inputCount = data.inputCount ?? 1;
  const outputCount = data.outputCount ?? 1;
  const minHeight = nodeHeight(Math.max(inputCount, outputCount));
  const flipped = data.flipped ?? false;
  const inputPos = flipped ? Position.Right : Position.Left;
  const outputPos = flipped ? Position.Left : Position.Right;

  return (
    <>
      <NodeResizer
        minWidth={64}
        minHeight={minHeight}
        isVisible={selected}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 1 }}
        handleStyle={{ backgroundColor: '#3b82f6', width: 8, height: 8, borderRadius: 2 }}
      />
      <div
        className={`w-full h-full border-2 rounded px-4 py-2 text-center shadow-sm select-none flex flex-col items-center justify-center relative ${selected ? 'border-blue-500' : 'border-slate-700'}`}
        style={{ backgroundColor: data.color ?? '#ffffff' }}
      >
        {/* Input handles */}
        {Array.from({ length: inputCount }).map((_, i) => (
          <Handle
            key={`in${i}`}
            type="target"
            position={inputPos}
            id={`in${i}`}
            style={{ top: handleTopPct(i, inputCount), transform: 'translateY(-50%)' }}
          />
        ))}

        <div className="text-sm text-slate-800 whitespace-pre-wrap">{data.text || 'Text'}</div>
        {data.label && <div className="text-[10px] text-slate-400 mt-0.5">{data.label}</div>}

        {/* Output handles */}
        {Array.from({ length: outputCount }).map((_, i) => (
          <Handle
            key={`out${i}`}
            type="source"
            position={outputPos}
            id={`out${i}`}
            style={{ top: handleTopPct(i, outputCount), transform: 'translateY(-50%)' }}
          />
        ))}
      </div>
    </>
  );
}
