import { useState, useCallback, useRef } from 'react';
import { saveBlob } from './utils/saveFile';
import type { Node, Edge } from 'reactflow';
import { MarkerType } from 'reactflow';
import { Toolbar } from './components/Toolbar';
import { Breadcrumb } from './components/Breadcrumb';
import { DiagramCanvas } from './components/DiagramCanvas';
import type { DiagramCanvasHandle } from './components/DiagramCanvas';
import { ExportMenu } from './components/ExportMenu';
import type { DiagramData, NavItem } from './types';

function normalizeEdges(edges: Edge[]): Edge[] {
  return edges.map((e) => ({
    ...e,
    type: 'labeled',
    data: e.data ?? {},
    style: { strokeWidth: 2, stroke: '#000000', ...e.style },
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#000000' },
  }));
}

// Ensure resizable nodes always have an explicit style.width/height so the
// ReactFlow wrapper renders at the right size when loaded from JSON.
// Old files that predate the resize feature won't have these — apply safe defaults.
function normalizeNodes(nodes: Node[]): Node[] {
  return nodes.map((n) => {
    if (n.style?.width && n.style?.height) return n; // already has dimensions
    switch (n.type) {
      case 'moduleNode': {
        const inputCount = Math.max(1, (n.data as { inputCount?: number }).inputCount ?? 1);
        const outputCount = Math.max(1, (n.data as { outputCount?: number }).outputCount ?? 1);
        // mirrors ModuleNode constants: PADDING_TOP=36, HANDLE_SPACING=28, PADDING_BOTTOM=20
        const h = 36 + Math.max(inputCount, outputCount) * 28 + 20;
        return { ...n, style: { width: 140, height: h, ...n.style } };
      }
      case 'customTextNode':
      case 'customLatexNode': {
        const count = Math.max(
          (n.data as { inputCount?: number }).inputCount ?? 1,
          (n.data as { outputCount?: number }).outputCount ?? 1
        );
        // mirrors nodeHeight: max(52, 14*2 + count*26)
        const h = Math.max(52, 28 + count * 26);
        return { ...n, style: { width: 140, height: h, ...n.style } };
      }
      case 'groupRectNode':
        return { ...n, style: { width: 200, height: 150, ...n.style } };
      case 'triangleNode':
        return { ...n, style: { width: 72, height: 56, ...n.style } };
      default:
        return n;
    }
  });
}

function normalizeDiagrams(diagrams: Record<string, DiagramData>): Record<string, DiagramData> {
  return Object.fromEntries(
    Object.entries(diagrams).map(([id, d]) => [
      id,
      { nodes: normalizeNodes(d.nodes), edges: normalizeEdges(d.edges) },
    ])
  );
}

interface SaveFile {
  version: number;
  diagrams: Record<string, DiagramData>;
}

function App() {
  const [diagrams, setDiagrams] = useState<Record<string, DiagramData>>({
    root: { nodes: [], edges: [] },
  });
  const [navStack, setNavStack] = useState<NavItem[]>([{ id: 'root', label: 'Root' }]);
  const [importKey, setImportKey] = useState(0);
  const canvasHandleRef = useRef<DiagramCanvasHandle | null>(null);

  const currentDiagramId = navStack[navStack.length - 1].id;
  const currentDiagram = diagrams[currentDiagramId] ?? { nodes: [], edges: [] };

  const handleDiagramChange = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      setDiagrams((prev) => ({ ...prev, [currentDiagramId]: { nodes, edges } }));
    },
    [currentDiagramId]
  );

  const handleNavigateIntoModule = useCallback((nodeId: string, label: string) => {
    const childId = `diagram_${nodeId}`;
    setDiagrams((prev) => ({ ...prev, [childId]: prev[childId] ?? { nodes: [], edges: [] } }));
    setNavStack((prev) => [...prev, { id: childId, label }]);
  }, []);

  const handleNavigateTo = useCallback((index: number) => {
    setNavStack((prev) => prev.slice(0, index + 1));
  }, []);

  const handleCreateChildDiagram = useCallback((childId: string) => {
    setDiagrams((prev) => ({ ...prev, [childId]: prev[childId] ?? { nodes: [], edges: [] } }));
  }, []);

  const handleCopyChildDiagram = useCallback((sourceId: string, destId: string) => {
    setDiagrams((prev) => ({
      ...prev,
      [destId]: prev[sourceId] ? { nodes: [...prev[sourceId].nodes], edges: [...prev[sourceId].edges] } : { nodes: [], edges: [] },
    }));
  }, []);

  // JSON export — saves all diagrams
  const handleExportJson = useCallback(() => {
    const save: SaveFile = { version: 1, diagrams };
    const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
    saveBlob(blob, 'diagram.json', [{ description: 'JSON file', accept: { 'application/json': ['.json'] } }]);
  }, [diagrams]);

  // JSON import — restores all diagrams, resets nav to root
  const handleImportJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const save = JSON.parse(e.target?.result as string) as SaveFile;
        if (!save.diagrams || !save.diagrams.root) {
          alert('Invalid diagram file.');
          return;
        }
        setDiagrams(normalizeDiagrams(save.diagrams));
        setNavStack([{ id: 'root', label: 'Root' }]);
        setImportKey((k) => k + 1);
      } catch {
        alert('Could not parse file.');
      }
    };
    reader.readAsText(file);
  }, []);

  // JSON merge — appends imported diagram into the current view without replacing anything
  const handleMergeJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const save = JSON.parse(e.target?.result as string) as SaveFile;
        if (!save.diagrams || !save.diagrams.root) {
          alert('Invalid diagram file.');
          return;
        }
        const normalized = normalizeDiagrams(save.diagrams);

        // Use a timestamp suffix to make all imported IDs unique
        const suffix = `_imp${Date.now()}`;
        const nodeIdMap = new Map<string, string>();
        const diagIdMap = new Map<string, string>();

        // First pass: assign new IDs to every node across every diagram
        for (const diag of Object.values(normalized)) {
          for (const node of diag.nodes) {
            const newNodeId = node.id + suffix;
            nodeIdMap.set(node.id, newNodeId);
            if (node.type === 'moduleNode') {
              const oldChildId = (node.data as { childDiagramId?: string }).childDiagramId;
              if (oldChildId) diagIdMap.set(oldChildId, `diagram_${newNodeId}`);
            }
          }
        }

        const remapDiagram = (diag: DiagramData): DiagramData => ({
          nodes: diag.nodes.map((n) => {
            const newId = nodeIdMap.get(n.id) ?? n.id;
            const data = { ...(n.data as Record<string, unknown>) };
            if (n.type === 'moduleNode') {
              const oldChildId = data.childDiagramId as string | undefined;
              if (oldChildId) data.childDiagramId = diagIdMap.get(oldChildId) ?? oldChildId;
            }
            return { ...n, id: newId, data, selected: false };
          }),
          edges: diag.edges.map((e) => ({
            ...e,
            id: e.id + suffix,
            source: nodeIdMap.get(e.source) ?? e.source,
            target: nodeIdMap.get(e.target) ?? e.target,
            selected: false,
          })),
        });

        // Remap all child diagrams
        const newChildDiagrams: Record<string, DiagramData> = {};
        for (const [diagId, diag] of Object.entries(normalized)) {
          if (diagId === 'root') continue;
          const newDiagId = diagIdMap.get(diagId);
          if (newDiagId) newChildDiagrams[newDiagId] = remapDiagram(diag);
        }

        // Merge remapped root into the currently active diagram
        const remappedRoot = remapDiagram(normalized.root);
        setDiagrams((prev) => {
          const current = prev[currentDiagramId] ?? { nodes: [], edges: [] };
          return {
            ...prev,
            ...newChildDiagrams,
            [currentDiagramId]: {
              nodes: [...current.nodes, ...remappedRoot.nodes],
              edges: [...current.edges, ...remappedRoot.edges],
            },
          };
        });
      } catch {
        alert('Could not parse file.');
      }
    };
    reader.readAsText(file);
  }, [currentDiagramId]);

  // Image export — delegates to canvas
  const handleExportPng = useCallback(() => canvasHandleRef.current?.exportImage('png'), []);
  const handleExportSvg = useCallback(() => canvasHandleRef.current?.exportImage('svg'), []);

  // New drawing — clears all diagrams and resets navigation
  const handleNewDrawing = useCallback(() => {
    if (!window.confirm('Start a new drawing? All unsaved changes will be lost.')) return;
    setDiagrams({ root: { nodes: [], edges: [] } });
    setNavStack([{ id: 'root', label: 'Root' }]);
    setImportKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="flex items-center justify-between pr-2 bg-slate-800 border-b border-slate-700">
        <Breadcrumb navStack={navStack} onNavigate={handleNavigateTo} />
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewDrawing}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            title="New drawing"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z"/>
            </svg>
            New
          </button>
          <ExportMenu
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onMergeJson={handleMergeJson}
            onExportPng={handleExportPng}
            onExportSvg={handleExportSvg}
          />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Toolbar />
        <DiagramCanvas
          key={`${currentDiagramId}-${importKey}`}
          diagram={currentDiagram}
          onDiagramChange={handleDiagramChange}
          onNavigateIntoModule={handleNavigateIntoModule}
          onCreateChildDiagram={handleCreateChildDiagram}
          onCopyChildDiagram={handleCopyChildDiagram}
          onExportReady={(handle) => { canvasHandleRef.current = handle; }}
          onNavigateBack={navStack.length > 1 ? () => handleNavigateTo(navStack.length - 2) : undefined}
        />
      </div>
    </div>
  );
}

export default App;
