import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from 'reactflow';
import type { Node, Edge, Connection, NodeMouseHandler, EdgeMouseHandler, NodeChange, EdgeChange } from 'reactflow';
import { toPng, toSvg } from 'html-to-image';
import { nodeTypes, edgeTypes } from '../nodes';
import { EditModal } from './EditModal';
import { EdgeLabelModal } from './EdgeLabelModal';
import { AlignmentToolbar } from './AlignmentToolbar';
import { ContextMenu } from './ContextMenu';
import type { ContextMenuState } from './ContextMenu';
import { NodeEditContext } from '../context/NodeEditContext';
import { EdgeUpdateContext } from '../context/EdgeUpdateContext';
import type { DiagramData, BlockNodeType, ModuleNodeData, Waypoint } from '../types';
import { defaultNodeData } from '../types';
import { applyAlignment } from '../hooks/useAlignment';
import type { AlignType } from '../hooks/useAlignment';

export interface DiagramCanvasHandle {
  exportImage: (format: 'png' | 'svg') => Promise<void>;
}

interface DiagramCanvasProps {
  diagram: DiagramData;
  onDiagramChange: (nodes: Node[], edges: Edge[]) => void;
  onNavigateIntoModule: (nodeId: string, label: string) => void;
  onCreateChildDiagram: (childId: string) => void;
  onExportReady: (handle: DiagramCanvasHandle) => void;
}

let nodeIdCounter = Date.now();
function genId() {
  return `node_${nodeIdCounter++}`;
}

function download(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function excludeUi(node: HTMLElement) {
  if (node.classList?.contains('react-flow__minimap')) return false;
  if (node.classList?.contains('react-flow__controls')) return false;
  if (node.classList?.contains('react-flow__attribution')) return false;
  return true;
}

function Canvas({
  diagram,
  onDiagramChange,
  onNavigateIntoModule,
  onCreateChildDiagram,
  onExportReady,
}: DiagramCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(diagram.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(diagram.edges);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  // Expose export function to parent
  useEffect(() => {
    onExportReady({
      exportImage: async (format) => {
        fitView({ padding: 0.15, duration: 0 });
        await new Promise((r) => setTimeout(r, 50));
        const el = reactFlowWrapper.current;
        if (!el) return;
        if (format === 'png') {
          const dataUrl = await toPng(el, { backgroundColor: '#ffffff', filter: excludeUi, pixelRatio: 2 });
          download(dataUrl, 'diagram.png');
        } else {
          const dataUrl = await toSvg(el, { backgroundColor: '#ffffff', filter: excludeUi });
          download(dataUrl, 'diagram.svg');
        }
      },
    });
  }, [onExportReady, fitView]);

  // Sync diagram state up to App via effect
  const initialMount = useRef(true);
  useEffect(() => {
    if (initialMount.current) { initialMount.current = false; return; }
    onDiagramChange(nodes, edges);
  }, [nodes, edges]); // eslint-disable-line react-hooks/exhaustive-deps

  // Selected nodes (for alignment toolbar)
  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge({
          ...connection,
          type: 'labeled',
          data: {},
          style: { strokeWidth: 2, stroke: '#000000' },
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#000000' },
        }, eds)
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow/type') as BlockNodeType;
      if (!type) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const id = genId();
      const data = { ...defaultNodeData[type] };

      if (type === 'moduleNode') {
        const childId = `diagram_${id}`;
        (data as unknown as ModuleNodeData).childDiagramId = childId;
        onCreateChildDiagram(childId);
      }

      const extraProps: Partial<Node> = {};
      if (type === 'groupRectNode') {
        extraProps.style = { width: 200, height: 150 };
        extraProps.zIndex = -1;
      }
      if (type === 'customTextNode') {
        extraProps.style = { width: 140, height: 60 };
      }

      setNodes((nds) => [...nds, { id, type, position, data, ...extraProps }]);
    },
    [screenToFlowPosition, setNodes, onCreateChildDiagram]
  );

  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      if (node.type === 'moduleNode') {
        onNavigateIntoModule(node.id, (node.data as ModuleNodeData).label || 'Module');
      } else {
        setEditingNode(node);
      }
    },
    [onNavigateIntoModule]
  );

  const onEdgeDoubleClick: EdgeMouseHandler = useCallback((_e, edge) => {
    setEditingEdge(edge);
  }, []);

  const openEditForNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) setEditingNode(node);
    },
    [nodes]
  );

  const handleUpdateEdgeWaypoints = useCallback(
    (edgeId: string, updater: Waypoint[] | ((prev: Waypoint[]) => Waypoint[])) => {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== edgeId) return e;
          const prev: Waypoint[] = e.data?.waypoints ?? [];
          const waypoints = typeof updater === 'function' ? updater(prev) : updater;
          return { ...e, data: { ...e.data, waypoints } };
        })
      );
    },
    [setEdges]
  );

  const handleSaveEdit = useCallback(
    (id: string, newData: Record<string, unknown>) => {
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: newData } : n)));
    },
    [setNodes]
  );

  const handleSaveEdgeLabel = useCallback(
    (id: string, label: string) => {
      setEdges((eds) =>
        eds.map((e) => e.id === id ? { ...e, data: { ...e.data, label: label || undefined } } : e)
      );
    },
    [setEdges]
  );

  const handleAlign = useCallback(
    (type: AlignType) => {
      const selectedIds = new Set(selectedNodes.map((n) => n.id));
      setNodes((nds) => applyAlignment(nds, selectedIds, type));
    },
    [selectedNodes, setNodes]
  );

  // Context menu handlers
  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: Node) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'node', targetId: node.id });
  }, []);

  const onEdgeContextMenu = useCallback((e: React.MouseEvent, edge: Edge) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'edge', targetId: edge.id });
  }, []);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextDeleteNode = useCallback((id: string) => {
    onNodesChange([{ type: 'remove', id }] as NodeChange[]);
  }, [onNodesChange]);

  const handleContextDeleteEdge = useCallback((id: string) => {
    onEdgesChange([{ type: 'remove', id }] as EdgeChange[]);
  }, [onEdgesChange]);

  const handleContextEditEdgeLabel = useCallback((id: string) => {
    const edge = edges.find((e) => e.id === id);
    if (edge) setEditingEdge(edge);
  }, [edges]);

  // Close context menu on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <EdgeUpdateContext.Provider value={handleUpdateEdgeWaypoints}>
    <NodeEditContext.Provider value={openEditForNode}>
      <div ref={reactFlowWrapper} className="flex-1 h-full w-full relative" style={{ minHeight: 0 }}>
        <ReactFlow
          style={{ width: '100%', height: '100%' }}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode="Delete"
          snapToGrid={snapEnabled}
          snapGrid={[20, 20]}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{
            type: 'labeled',
            data: {},
            style: { strokeWidth: 2, stroke: '#000000' },
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#000000' },
          }}
          attributionPosition="bottom-right"
        >
          <Background color="#e2e8f0" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const colors: Record<string, string> = {
                gainNode: '#e2e8f0',
                triangleNode: '#e2e8f0',
                integratorNode: '#e2e8f0',
                derivativeNode: '#e2e8f0',
                sumNode: '#e2e8f0',
                transferFunctionNode: '#e2e8f0',
                customTextNode: '#e2e8f0',
                customLatexNode: '#e2e8f0',
                moduleNode: '#cbd5e1',
                switchNode: '#e2e8f0',
                textLabelNode: 'transparent',
                groupRectNode: '#f1f5f9',
              };
              return colors[n.type ?? ''] ?? '#e2e8f0';
            }}
            className="rounded-lg overflow-hidden shadow"
          />
        </ReactFlow>

        {/* Snap to grid toggle */}
        <button
          title={snapEnabled ? 'Snap to grid: ON' : 'Snap to grid: OFF'}
          onClick={() => setSnapEnabled((v) => !v)}
          className={`absolute bottom-[120px] right-3 z-10 w-7 h-7 rounded border flex items-center justify-center text-[10px] font-bold shadow-sm transition-colors ${
            snapEnabled
              ? 'bg-blue-600 border-blue-700 text-white'
              : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="2" cy="2" r="1" fill="currentColor"/>
            <circle cx="6.5" cy="2" r="1" fill="currentColor"/>
            <circle cx="11" cy="2" r="1" fill="currentColor"/>
            <circle cx="2" cy="6.5" r="1" fill="currentColor"/>
            <circle cx="6.5" cy="6.5" r="1" fill="currentColor"/>
            <circle cx="11" cy="6.5" r="1" fill="currentColor"/>
            <circle cx="2" cy="11" r="1" fill="currentColor"/>
            <circle cx="6.5" cy="11" r="1" fill="currentColor"/>
            <circle cx="11" cy="11" r="1" fill="currentColor"/>
          </svg>
        </button>

        {/* Alignment toolbar — visible when ≥2 nodes selected */}
        <AlignmentToolbar nodeCount={selectedNodes.length} onAlign={handleAlign} />

        <EditModal
          node={editingNode}
          onSave={handleSaveEdit}
          onClose={() => setEditingNode(null)}
        />

        <EdgeLabelModal
          edge={editingEdge}
          onSave={handleSaveEdgeLabel}
          onClose={() => setEditingEdge(null)}
        />

        {contextMenu && (
          <ContextMenu
            menu={contextMenu}
            onClose={() => setContextMenu(null)}
            onEditNode={openEditForNode}
            onDeleteNode={handleContextDeleteNode}
            onEditEdgeLabel={handleContextEditEdgeLabel}
            onDeleteEdge={handleContextDeleteEdge}
          />
        )}

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-300 text-sm select-none">Drag blocks from the toolbar to get started</p>
          </div>
        )}
      </div>
    </NodeEditContext.Provider>
    </EdgeUpdateContext.Provider>
  );
}

export function DiagramCanvas(props: DiagramCanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
