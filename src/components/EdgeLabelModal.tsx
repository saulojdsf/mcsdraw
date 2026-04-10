import { useState, useEffect } from 'react';
import type { Edge } from 'reactflow';

interface EdgeLabelModalProps {
  edge: Edge | null;
  onSave: (id: string, label: string) => void;
  onClose: () => void;
}

export function EdgeLabelModal({ edge, onSave, onClose }: EdgeLabelModalProps) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (edge) setLabel((edge.data?.label as string) ?? '');
  }, [edge]);

  if (!edge) return null;

  const handleSave = () => {
    onSave(edge.id, label);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[320px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-slate-800">Signal Label</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
            Signal Name
          </label>
          <input
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. e(t), u(t), y(t)"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onClose();
            }}
          />
          <p className="text-[10px] text-slate-400 mt-1.5">Leave blank to remove the label.</p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
