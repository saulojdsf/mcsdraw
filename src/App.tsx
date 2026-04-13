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

function normalizeDiagrams(diagrams: Record<string, DiagramData>): Record<string, DiagramData> {
  return Object.fromEntries(
    Object.entries(diagrams).map(([id, d]) => [id, { ...d, edges: normalizeEdges(d.edges) }])
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
          onExportReady={(handle) => { canvasHandleRef.current = handle; }}
          onNavigateBack={navStack.length > 1 ? () => handleNavigateTo(navStack.length - 2) : undefined}
        />
      </div>
    </div>
  );
}

export default App;
