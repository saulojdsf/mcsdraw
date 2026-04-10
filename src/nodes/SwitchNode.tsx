import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { SwitchNodeData } from '../types';

const W = 72;
const PADDING_V = 14;
const HANDLE_SPACING = 26;

function nodeHeight(count: number) {
  return PADDING_V * 2 + count * HANDLE_SPACING;
}

function handleTop(index: number, count: number, height: number) {
  const usable = height - PADDING_V * 2;
  const step = usable / count;
  return PADDING_V + step * index + step / 2;
}

export function SwitchNode({ data, selected }: NodeProps<SwitchNodeData>) {
  const stroke = selected ? '#3b82f6' : '#334155';
  const fill = data.color ?? '#ffffff';
  const count = data.inputCount ?? 2;
  const H = nodeHeight(count);
  const outY = H / 2;
  const cx2 = W - 14;

  return (
    <div style={{ width: W, position: 'relative' }}>
      {/* Input handles */}
      {Array.from({ length: count }, (_, i) => (
        <Handle
          key={`in${i}`}
          type="target"
          position={Position.Left}
          id={`in${i}`}
          style={{ top: handleTop(i, count, H), transform: 'translateY(-50%)' }}
        />
      ))}

      {/* Control signal handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="ctrl"
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      />

      <svg width={W} height={H}>
        {/* Body */}
        <rect x={1} y={1} width={W - 2} height={H - 2} rx={3} fill={fill} stroke={stroke} strokeWidth={2} />

        {/* Input terminal dots and switch arms */}
        {Array.from({ length: count }, (_, i) => {
          const iy = handleTop(i, count, H);
          return (
            <g key={i}>
              <circle cx={14} cy={iy} r={2.5} fill={stroke} />
              {/* Arm from each input converging toward output */}
              <line
                x1={14} y1={iy}
                x2={cx2 - 2} y2={outY - (count > 1 ? (i - (count - 1) / 2) * 4 : 0)}
                stroke={stroke}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeDasharray={i === 0 ? 'none' : '3 2'}
                opacity={i === 0 ? 1 : 0.4}
              />
            </g>
          );
        })}

        {/* Output terminal dot */}
        <circle cx={cx2} cy={outY} r={2.5} fill={stroke} />

        {/* Optional text */}
        {data.text && (
          <text
            x={W / 2}
            y={H - 7}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fontFamily="ui-monospace, monospace"
            fontWeight="600"
            fill="#1e293b"
          >
            {data.text}
          </text>
        )}

        {/* ctrl annotation */}
        <text
          x={W / 2 + 6}
          y={8}
          textAnchor="start"
          dominantBaseline="middle"
          fontSize="7"
          fontFamily="ui-monospace, monospace"
          fill="#94a3b8"
        >
          ctrl
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
        style={{ top: outY, transform: 'translateY(-50%)' }}
      />
    </div>
  );
}
