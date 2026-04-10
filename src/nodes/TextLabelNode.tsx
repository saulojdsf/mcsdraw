import type { NodeProps } from 'reactflow';
import type { TextLabelNodeData } from '../types';

export function TextLabelNode({ data, selected }: NodeProps<TextLabelNodeData>) {
  return (
    <div
      className={`px-1 py-0.5 rounded select-none ${selected ? 'outline outline-2 outline-blue-400 outline-offset-2' : ''}`}
      style={{ fontSize: data.fontSize ?? 14, color: data.color ?? '#1e293b', whiteSpace: 'pre-wrap', maxWidth: 300 }}
    >
      {data.text || 'Label'}
    </div>
  );
}
