import React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { SumNodeData } from '../types';

const HANDLE_SPACING = 26;
const PADDING_V = 14;
const NODE_WIDTH = 52;

function nodeHeight(count: number) {
  return PADDING_V * 2 + count * HANDLE_SPACING;
}

function handleTop(index: number, count: number, height: number) {
  const usable = height - PADDING_V * 2;
  const step = usable / count;
  return PADDING_V + step * index + step / 2;
}

export function SumNode({ data, selected }: NodeProps<SumNodeData>) {
  const signs = data.signs ?? ['+', '+'];
  const count = signs.length;
  const height = nodeHeight(count);
  const flipped = data.flipped ?? false;
  const inputPos = flipped ? Position.Right : Position.Left;
  const outputPos = flipped ? Position.Left : Position.Right;
  const labelStyle: React.CSSProperties = flipped
    ? { right: 8, top: '50%', transform: 'translateY(-50%)', whiteSpace: 'nowrap' }
    : { left: 8, top: '50%', transform: 'translateY(-50%)', whiteSpace: 'nowrap' };

  return (
    <div
      className={`border-2 flex items-center justify-center shadow-sm select-none relative ${selected ? 'border-blue-500' : 'border-slate-700'}`}
      style={{ width: NODE_WIDTH, height, borderRadius: NODE_WIDTH / 2, backgroundColor: data.color ?? '#ffffff' }}
    >
      {/* Input handles with signs */}
      {signs.map((sign, i) => {
        const top = handleTop(i, count, height);
        return (
          <Handle
            key={`in${i}`}
            type="target"
            position={inputPos}
            id={`in${i}`}
            style={{ top, transform: 'translateY(-50%)' }}
          >
            <span
              className="absolute text-[9px] font-bold text-slate-600 pointer-events-none"
              style={labelStyle}
            >
              {sign}
            </span>
          </Handle>
        );
      })}

      <span className="text-base font-bold text-slate-800 z-10">∑</span>

      <Handle
        type="source"
        position={outputPos}
        id="out"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />

      {data.label && (
        <div
          className="absolute text-[10px] text-slate-400 whitespace-nowrap"
          style={{ top: height + 2, left: '50%', transform: 'translateX(-50%)' }}
        >
          {data.label}
        </div>
      )}
    </div>
  );
}
