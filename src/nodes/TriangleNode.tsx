import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { GainNodeData } from '../types';

const W = 72;
const H = 56;

export function TriangleNode({ data, selected }: NodeProps<GainNodeData>) {
  const stroke = selected ? '#3b82f6' : '#334155';
  const fill = data.color ?? '#ffffff';
  const flipped = data.flipped ?? false;
  const inputPos = flipped ? Position.Right : Position.Left;
  const outputPos = flipped ? Position.Left : Position.Right;
  // Normal: tip points right; flipped: tip points left
  const points = flipped
    ? `${W - 2},2 2,${H / 2} ${W - 2},${H - 2}`
    : `2,2 ${W - 2},${H / 2} 2,${H - 2}`;
  const textX = flipped ? W * 0.62 : W * 0.38;

  return (
    <div style={{ width: W, height: H, position: 'relative' }}>
      <Handle
        type="target"
        position={inputPos}
        style={{ top: H / 2, transform: 'translateY(-50%)' }}
      />

      <svg width={W} height={H}>
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <text
          x={textX}
          y={H / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="13"
          fontFamily="ui-monospace, monospace"
          fontWeight="600"
          fill="#1e293b"
        >
          {data.gain || 'K'}
        </text>
      </svg>

      {data.label && (
        <div
          className="text-[10px] text-slate-400 text-center whitespace-nowrap"
          style={{ position: 'absolute', top: H + 2, left: '50%', transform: 'translateX(-50%)' }}
        >
          {data.label}
        </div>
      )}

      <Handle
        type="source"
        position={outputPos}
        style={{ top: H / 2, transform: 'translateY(-50%)' }}
      />
    </div>
  );
}
