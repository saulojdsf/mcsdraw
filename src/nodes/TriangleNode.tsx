import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { GainNodeData } from '../types';

const W = 72;
const H = 56;

export function TriangleNode({ data, selected }: NodeProps<GainNodeData>) {
  const stroke = selected ? '#3b82f6' : '#334155';
  const fill = data.color ?? '#ffffff';

  return (
    <div style={{ width: W, height: H, position: 'relative' }}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ top: H / 2, transform: 'translateY(-50%)' }}
      />

      <svg width={W} height={H}>
        <polygon
          points={`2,2 ${W - 2},${H / 2} 2,${H - 2}`}
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <text
          x={W * 0.38}
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
        position={Position.Right}
        style={{ top: H / 2, transform: 'translateY(-50%)' }}
      />
    </div>
  );
}
