import { useState, useEffect } from 'react';
import type { Node } from 'reactflow';
import { renderLatex } from '../utils/latex';

interface EditModalProps {
  node: Node | null;
  onSave: (id: string, newData: Record<string, unknown>) => void;
  onClose: () => void;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      {multiline ? (
        <textarea
          className="border border-slate-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="border border-slate-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

const COLOR_PRESETS = [
  '#ffffff', '#dbeafe', '#dcfce7', '#fef9c3',
  '#ffedd5', '#fee2e2', '#f3e8ff', '#f1f5f9',
  '#bfdbfe', '#bbf7d0', '#fde68a', '#fed7aa',
];

function ColorPicker({ value, onChange, label = 'Color' }: { value: string; onChange: (v: string) => void; label?: string }) {
  const active = value || '#ffffff';
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="flex flex-wrap gap-1.5 items-center">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onChange(c)}
            className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${active === c ? 'border-blue-500 scale-110' : 'border-slate-300'}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <label className="w-6 h-6 rounded border-2 border-slate-300 cursor-pointer overflow-hidden hover:scale-110 transition-transform" title="Custom color">
          <input
            type="color"
            value={active}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 -ml-1 -mt-1 cursor-pointer border-0 p-0"
          />
        </label>
      </div>
    </div>
  );
}

function LatexPreview({ formula }: { formula: string }) {
  return (
    <div className="border border-slate-200 rounded p-3 bg-slate-50 text-center min-h-[40px] flex items-center justify-center">
      <span
        dangerouslySetInnerHTML={{ __html: renderLatex(formula || '\\cdot') }}
      />
    </div>
  );
}

export function EditModal({ node, onSave, onClose }: EditModalProps) {
  const [data, setData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (node) setData({ ...node.data });
  }, [node]);

  if (!node) return null;

  const set = (key: string, val: unknown) => setData((d) => ({ ...d, [key]: val }));

  const handleSave = () => {
    onSave(node.id, data);
    onClose();
  };

  const renderFields = () => {
    switch (node.type) {
      case 'gainNode':
      case 'triangleNode':
        return (
          <>
            <Field label="Gain Value" value={data.gain as string ?? ''} onChange={(v) => set('gain', v)} placeholder="K" />
            <Field label="Label (optional)" value={data.label as string ?? ''} onChange={(v) => set('label', v)} placeholder="e.g. proportional gain" />
          </>
        );

      case 'integratorNode':
      case 'derivativeNode':
        return (
          <Field label="Label (optional)" value={data.label as string ?? ''} onChange={(v) => set('label', v)} placeholder="optional label" />
        );

      case 'sumNode': {
        const signs = (data.signs as string[]) ?? ['+', '+'];
        return (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Signs</label>
              <div className="flex gap-3">
                {signs.map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400">Input {i + 1}</span>
                    <select
                      className="border border-slate-300 rounded px-2 py-1 text-sm"
                      value={s}
                      onChange={(e) => {
                        const next = [...signs];
                        next[i] = e.target.value;
                        set('signs', next);
                      }}
                    >
                      <option value="+">+</option>
                      <option value="-">−</option>
                    </select>
                  </div>
                ))}
              </div>
              <button
                className="text-xs text-blue-600 hover:underline mt-1 text-left"
                onClick={() => set('signs', [...signs, '+'])}
              >
                + Add input
              </button>
              {signs.length > 2 && (
                <button
                  className="text-xs text-red-500 hover:underline text-left"
                  onClick={() => set('signs', signs.slice(0, -1))}
                >
                  − Remove last input
                </button>
              )}
            </div>
            <Field label="Label (optional)" value={data.label as string ?? ''} onChange={(v) => set('label', v)} />
          </>
        );
      }

      case 'multiplyNode': {
        const roles = (data.roles as string[]) ?? ['×', '×'];
        return (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inputs</label>
              <div className="flex flex-wrap gap-3">
                {roles.map((r, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400">Input {i + 1}</span>
                    <select
                      className="border border-slate-300 rounded px-2 py-1 text-sm"
                      value={r}
                      onChange={(e) => { const next = [...roles]; next[i] = e.target.value; set('roles', next); }}
                    >
                      <option value="×">× multiply</option>
                      <option value="÷">÷ divide</option>
                    </select>
                  </div>
                ))}
              </div>
              <button className="text-xs text-blue-600 hover:underline mt-1 text-left" onClick={() => set('roles', [...roles, '×'])}>+ Add input</button>
              {roles.length > 2 && (
                <button className="text-xs text-red-500 hover:underline text-left" onClick={() => set('roles', roles.slice(0, -1))}>− Remove last input</button>
              )}
            </div>
            <Field label="Label (optional)" value={data.label as string ?? ''} onChange={(v) => set('label', v)} />
          </>
        );
      }

      case 'divideNode': {
        const roles = (data.roles as string[]) ?? ['N', 'D'];
        return (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inputs</label>
              <div className="flex flex-wrap gap-3">
                {roles.map((r, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400">Input {i + 1}</span>
                    <select
                      className="border border-slate-300 rounded px-2 py-1 text-sm"
                      value={r}
                      onChange={(e) => { const next = [...roles]; next[i] = e.target.value; set('roles', next); }}
                    >
                      <option value="N">N numerator</option>
                      <option value="D">D denominator</option>
                    </select>
                  </div>
                ))}
              </div>
              <button className="text-xs text-blue-600 hover:underline mt-1 text-left" onClick={() => set('roles', [...roles, 'D'])}>+ Add input</button>
              {roles.length > 2 && (
                <button className="text-xs text-red-500 hover:underline text-left" onClick={() => set('roles', roles.slice(0, -1))}>− Remove last input</button>
              )}
            </div>
            <Field label="Label (optional)" value={data.label as string ?? ''} onChange={(v) => set('label', v)} />
          </>
        );
      }

      case 'transferFunctionNode': {
        const num = data.numerator as string ?? '1';
        const den = data.denominator as string ?? 's+1';
        return (
          <>
            <Field label="Numerator (LaTeX)" value={num} onChange={(v) => set('numerator', v)} placeholder="e.g. 1" />
            <Field label="Denominator (LaTeX)" value={den} onChange={(v) => set('denominator', v)} placeholder="e.g. s+1" />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Preview</label>
              <LatexPreview formula={`\\dfrac{${num}}{${den}}`} />
            </div>
            <Field label="Label (optional)" value={data.label as string ?? ''} onChange={(v) => set('label', v)} />
          </>
        );
      }

      case 'customTextNode':
        return (
          <>
            <Field label="Text Content" value={data.text as string ?? ''} onChange={(v) => set('text', v)} placeholder="Enter text..." multiline />
            <Field label="Label (optional)" value={data.label as string ?? ''} onChange={(v) => set('label', v)} />
          </>
        );

      case 'customLatexNode': {
        const formula = data.formula as string ?? '';
        const inputCount = data.inputCount as number ?? 1;
        return (
          <>
            <Field label="LaTeX Formula" value={formula} onChange={(v) => set('formula', v)} placeholder="e.g. \frac{K}{s+a}" multiline />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Preview</label>
              <LatexPreview formula={formula} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Number of Inputs</label>
              <input
                type="number"
                min={0}
                max={8}
                className="border border-slate-300 rounded px-2 py-1.5 text-sm"
                value={inputCount}
                onChange={(e) => set('inputCount', Math.max(0, Math.min(8, parseInt(e.target.value) || 0)))}
              />
            </div>
            <Field label="Label (optional)" value={data.label as string ?? ''} onChange={(v) => set('label', v)} />
          </>
        );
      }

      case 'switchNode':
        return (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inputs</label>
              <input
                type="number"
                min={1}
                max={8}
                className="border border-slate-300 rounded px-2 py-1.5 text-sm"
                value={data.inputCount as number ?? 2}
                onChange={(e) => set('inputCount', Math.max(1, Math.min(8, parseInt(e.target.value) || 1)))}
              />
            </div>
            <Field label="Text (inside block)" value={data.text as string ?? ''} onChange={(v) => set('text', v)} placeholder="e.g. SW1" />
            <Field label="Label (optional)" value={data.label as string ?? ''} onChange={(v) => set('label', v)} placeholder="optional label" />
          </>
        );

      case 'moduleNode':
        return (
          <>
            <Field label="Module Name" value={data.label as string ?? ''} onChange={(v) => set('label', v)} placeholder="Module" />
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inputs</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  className="border border-slate-300 rounded px-2 py-1.5 text-sm"
                  value={data.inputCount as number ?? 1}
                  onChange={(e) => set('inputCount', Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Outputs</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  className="border border-slate-300 rounded px-2 py-1.5 text-sm"
                  value={data.outputCount as number ?? 1}
                  onChange={(e) => set('outputCount', Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </div>
          </>
        );

      case 'textLabelNode':
        return (
          <>
            <Field label="Text" value={data.text as string ?? ''} onChange={(v) => set('text', v)} placeholder="Label text..." multiline />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Font Size</label>
              <input
                type="number"
                min={8}
                max={72}
                className="border border-slate-300 rounded px-2 py-1.5 text-sm"
                value={data.fontSize as number ?? 14}
                onChange={(e) => set('fontSize', Math.max(8, Math.min(72, parseInt(e.target.value) || 14)))}
              />
            </div>
          </>
        );

      case 'groupRectNode':
        return (
          <Field label="Group Label (optional)" value={data.label as string ?? ''} onChange={(v) => set('label', v)} placeholder="e.g. Controller" />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[400px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-slate-800">Edit Block</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {renderFields()}
          <div className="border-t border-slate-100 pt-3">
            <ColorPicker
              label={node.type === 'textLabelNode' ? 'Text Color' : node.type === 'groupRectNode' ? 'Background Color' : 'Fill Color'}
              value={data.color as string ?? ''}
              onChange={(v) => set('color', v)}
            />
          </div>
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
