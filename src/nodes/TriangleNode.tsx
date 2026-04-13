import { Handle, Position, NodeResizer } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { GainNodeData } from '../types';

const MIN_W = 72;
const MIN_H = 56;
// ViewBox dimensions match the minimum size so stroke/text scale naturally
const VB_W = 72;
const VB_H = 56;

export function TriangleNode({ data, selected }: NodeProps<GainNodeData>) {
  const stroke = selected ? '#3b82f6' : '#334155';
  const fill = data.color ?? '#ffffff';
  const flipped = data.flipped ?? false;
  const inputPos = flipped ? Position.Right : Position.Left;
  const outputPos = flipped ? Position.Left : Position.Right;
  // Normal: tip points right; flipped: tip points left
  const points = flipped
    ? `${VB_W - 2},2 2,${VB_H / 2} ${VB_W - 2},${VB_H - 2}`
    : `2,2 ${VB_W - 2},${VB_H / 2} 2,${VB_H - 2}`;
  const textX = flipped ? VB_W * 0.62 : VB_W * 0.38;

  return (
    <>
      <NodeResizer
        minWidth={MIN_W}
        minHeight={MIN_H}
        isVisible={selected}
        lineStyle={{ borderColor: '#3b82f6', borderWidth: 1 }}
        handleStyle={{ backgroundColor: '#3b82f6', width: 8, height: 8, borderRadius: 2 }}
      />
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Handle
          type="target"
          position={inputPos}
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />

        <svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
          <polygon
            points={points}
            fill={fill}
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <text
            x={textX}
            y={VB_H / 2}
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
            style={{ position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)' }}
          >
            {data.label}
          </div>
        )}

        <Handle
          type="source"
          position={outputPos}
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
      </div>
    </>
  );
}
