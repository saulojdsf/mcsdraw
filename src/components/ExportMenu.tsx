import { useRef, useState } from 'react';

interface ExportMenuProps {
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onExportPng: () => void;
  onExportSvg: () => void;
}

export function ExportMenu({ onExportJson, onImportJson, onExportPng, onExportSvg }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const action = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImportJson(file);
    e.target.value = '';
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"/>
          <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.97a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.779a.749.749 0 1 1 1.06-1.06l1.97 1.97Z"/>
        </svg>
        Export / Import
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 opacity-60">
          <path d="M4.427 7.427l3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427z"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 text-sm">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Diagram</div>
            <button
              onClick={() => action(onExportJson)}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
            >
              <span className="text-slate-400">↓</span> Export JSON
            </button>
            <button
              onClick={() => { setOpen(false); fileInputRef.current?.click(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
            >
              <span className="text-slate-400">↑</span> Import JSON
            </button>
            <div className="my-1 border-t border-slate-100" />
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Image</div>
            <button
              onClick={() => action(onExportPng)}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
            >
              <span className="text-slate-400">↓</span> Export PNG
            </button>
            <button
              onClick={() => action(onExportSvg)}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
            >
              <span className="text-slate-400">↓</span> Export SVG
            </button>
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
