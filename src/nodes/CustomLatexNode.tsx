import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { renderLatex } from '../utils/latex';
import type { CustomLatexNodeData } from '../types';

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

export function CustomLatexNode({ data, selected }: NodeProps<CustomLatexNodeData>) {
  const inputCount = data.inputCount ?? 1;
  const height = nodeHeight(inputCount);

  return (
    <div
      className={`border-2 rounded px-4 py-2 min-w-[64px] text-center shadow-sm select-none relative ${selected ? 'border-blue-500' : 'border-slate-700'}`}
      style={{ backgroundColor: data.color ?? '#ffffff', minHeight: height }}
    >
      {/* Input handles */}
      {inputCount === 0 ? null : Array.from({ length: inputCount }).map((_, i) => (
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

      <div
        className="flex items-center justify-center"
        style={{ minHeight: height - 16 }}
      >
        <div className="text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: renderLatex(data.formula || '\\cdot') }} />
      </div>

      {data.label && (
        <div className="text-[10px] text-slate-400 mt-0.5">{data.label}</div>
      )}

      <Handle type="source" position={Position.Right} id="out" style={{ top: '50%', transform: 'translateY(-50%)' }} />
    </div>
  );
}
