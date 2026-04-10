import { useEffect, useRef } from 'react';

export interface ContextMenuState {
  x: number;
  y: number;
  type: 'node' | 'edge';
  targetId: string;
}

interface ContextMenuProps {
  menu: ContextMenuState;
  onClose: () => void;
  onEditNode: (id: string) => void;
  onDeleteNode: (id: string) => void;
  onEditEdgeLabel: (id: string) => void;
  onDeleteEdge: (id: string) => void;
}

function MenuItem({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-1.5 text-sm hover:bg-slate-50 ${danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700'}`}
    >
      {children}
    </button>
  );
}

export function ContextMenu({ menu, onClose, onEditNode, onDeleteNode, onEditEdgeLabel, onDeleteEdge }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Clamp position so menu doesn't overflow viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    left: menu.x,
    top: menu.y,
    zIndex: 1000,
  };

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      ref.current.style.left = `${menu.x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      ref.current.style.top = `${menu.y - rect.height}px`;
    }
  }, [menu]);

  return (
    <div
      ref={ref}
      style={style}
      className="bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[160px]"
      onContextMenu={(e) => e.preventDefault()}
    >
      {menu.type === 'node' && (
        <>
          <MenuItem onClick={() => { onEditNode(menu.targetId); onClose(); }}>
            Edit...
          </MenuItem>
          <div className="my-1 border-t border-slate-100" />
          <MenuItem danger onClick={() => { onDeleteNode(menu.targetId); onClose(); }}>
            Delete
          </MenuItem>
        </>
      )}
      {menu.type === 'edge' && (
        <>
          <MenuItem onClick={() => { onEditEdgeLabel(menu.targetId); onClose(); }}>
            Edit Label...
          </MenuItem>
          <div className="my-1 border-t border-slate-100" />
          <MenuItem danger onClick={() => { onDeleteEdge(menu.targetId); onClose(); }}>
            Delete
          </MenuItem>
        </>
      )}
    </div>
  );
}
