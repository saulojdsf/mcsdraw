import { useState, useCallback, useRef } from 'react';
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.json';
    a.click();
    URL.revokeObjectURL(url);
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

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="flex items-center justify-between pr-2 bg-slate-800 border-b border-slate-700">
        <Breadcrumb navStack={navStack} onNavigate={handleNavigateTo} />
        <ExportMenu
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          onExportPng={handleExportPng}
          onExportSvg={handleExportSvg}
        />
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
        />
      </div>
    </div>
  );
}

export default App;
