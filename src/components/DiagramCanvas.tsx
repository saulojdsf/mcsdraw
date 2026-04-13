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
import { saveDataUrl } from '../utils/saveFile';
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
  onCopyChildDiagram: (sourceId: string, destId: string) => void;
  onExportReady: (handle: DiagramCanvasHandle) => void;
  onNavigateBack?: () => void;
}

let nodeIdCounter = Date.now();
function genId() {
  return `node_${nodeIdCounter++}`;
}

const FLIPPABLE_TYPES = new Set([
  'triangleNode', 'sumNode', 'multiplyNode', 'divideNode',
  'customTextNode', 'customLatexNode', 'moduleNode', 'switchNode',
]);

// Module-level clipboard — survives navigation between diagram levels
let sharedClipboard: { nodes: Node[]; edges: Edge[] } | null = null;


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
  onCopyChildDiagram,
  onExportReady,
  onNavigateBack,
}: DiagramCanvasProps) {
  const [nodes, setNodes, onNodesChangeBase] = useNodesState(diagram.nodes);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState(diagram.edges);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const mouseScreenPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const { screenToFlowPosition, fitView } = useReactFlow();

  // Undo/redo history
  const history = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const future = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const isDragging = useRef(false);
  const isArrowMoving = useRef(false);

  const pushHistory = useCallback(() => {
    history.current = [...history.current.slice(-49), { nodes, edges }];
    future.current = [];
  }, [nodes, edges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      type PosChange = { type: string; dragging?: boolean };
      const hasRemove = changes.some(c => c.type === 'remove');
      const hasDragStart = changes.some(c => c.type === 'position' && (c as PosChange).dragging === true && !isDragging.current);
      const hasDragEnd = changes.some(c => c.type === 'position' && (c as PosChange).dragging === false && isDragging.current);
      if (hasRemove || hasDragStart) {
        history.current = [...history.current.slice(-49), { nodes, edges }];
        future.current = [];
      }
      if (hasDragStart) isDragging.current = true;
      if (hasDragEnd) isDragging.current = false;
      onNodesChangeBase(changes);
    },
    [onNodesChangeBase, nodes, edges]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (changes.some(c => c.type === 'remove')) {
        history.current = [...history.current.slice(-49), { nodes, edges }];
        future.current = [];
      }
      onEdgesChangeBase(changes);
    },
    [onEdgesChangeBase, nodes, edges]
  );

  const handleUndo = useCallback(() => {
    if (history.current.length === 0) return;
    const prev = history.current[history.current.length - 1];
    future.current = [...future.current.slice(-49), { nodes, edges }];
    history.current = history.current.slice(0, -1);
    setNodes(prev.nodes);
    setEdges(prev.edges);
  }, [nodes, edges, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current[future.current.length - 1];
    history.current = [...history.current.slice(-49), { nodes, edges }];
    future.current = future.current.slice(0, -1);
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [nodes, edges, setNodes, setEdges]);

  const handleCopy = useCallback(() => {
    const sel = nodes.filter(n => n.selected);
    if (sel.length === 0) return;
    const selIds = new Set(sel.map(n => n.id));
    sharedClipboard = { nodes: sel, edges: edges.filter(e => selIds.has(e.source) && selIds.has(e.target)) };
  }, [nodes, edges]);

  const handlePaste = useCallback(() => {
    if (!sharedClipboard) return;
    pushHistory();
    const { nodes: clipNodes, edges: clipEdges } = sharedClipboard;

    // Compute bounding box center of copied nodes
    const xs = clipNodes.map(n => n.position.x);
    const ys = clipNodes.map(n => n.position.y);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

    // Convert current mouse screen position to flow coordinates
    const mouseFlow = screenToFlowPosition(mouseScreenPos.current);

    const idMap = new Map<string, string>();
    const newNodes: Node[] = clipNodes.map(n => {
      const newId = genId();
      idMap.set(n.id, newId);
      let data = { ...(n.data as Record<string, unknown>) };
      if (n.type === 'moduleNode') {
        const originalChildId = data.childDiagramId as string | undefined;
        const childId = `diagram_${newId}`;
        data = { ...data, childDiagramId: childId };
        if (originalChildId) {
          onCopyChildDiagram(originalChildId, childId);
        } else {
          onCreateChildDiagram(childId);
        }
      }
      const position = {
        x: mouseFlow.x + (n.position.x - centerX),
        y: mouseFlow.y + (n.position.y - centerY),
      };
      return { ...n, id: newId, position, selected: true, data };
    });
    const newEdges: Edge[] = clipEdges.map(e => ({
      ...e,
      id: genId(),
      source: idMap.get(e.source) ?? e.source,
      target: idMap.get(e.target) ?? e.target,
      selected: false,
    }));
    setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]);
    setEdges(eds => [...eds, ...newEdges]);
  }, [pushHistory, setNodes, setEdges, onCreateChildDiagram, onCopyChildDiagram, screenToFlowPosition]);

  const handleCut = useCallback(() => {
    const sel = nodes.filter(n => n.selected);
    if (sel.length === 0) return;
    const selIds = new Set(sel.map(n => n.id));
    sharedClipboard = { nodes: sel, edges: edges.filter(e => selIds.has(e.source) && selIds.has(e.target)) };
    pushHistory();
    setNodes(nds => nds.filter(n => !selIds.has(n.id)));
    setEdges(eds => eds.filter(e => !selIds.has(e.source) && !selIds.has(e.target)));
  }, [nodes, edges, pushHistory, setNodes, setEdges]);

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
          await saveDataUrl(dataUrl, 'diagram.png', 'image/png', [{ description: 'PNG image', accept: { 'image/png': ['.png'] } }]);
        } else {
          const dataUrl = await toSvg(el, { backgroundColor: '#ffffff', filter: excludeUi });
          await saveDataUrl(dataUrl, 'diagram.svg', 'image/svg+xml', [{ description: 'SVG image', accept: { 'image/svg+xml': ['.svg'] } }]);
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
      pushHistory();
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
    [setEdges, pushHistory]
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
      pushHistory();

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
      if (type === 'customTextNode' || type === 'customLatexNode') {
        extraProps.style = { width: 140, height: 60 };
      }
      if (type === 'moduleNode') {
        // PADDING_TOP(36) + 1 * HANDLE_SPACING(28) + PADDING_BOTTOM(20) = 84
        extraProps.style = { width: 140, height: 84 };
      }
      if (type === 'triangleNode') {
        extraProps.style = { width: 72, height: 56 };
      }

      setNodes((nds) => [...nds, { id, type, position, data, ...extraProps }]);
    },
    [screenToFlowPosition, setNodes, onCreateChildDiagram, pushHistory]
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
      pushHistory();
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: newData } : n)));
    },
    [setNodes, pushHistory]
  );

  const handleSaveEdgeLabel = useCallback(
    (id: string, label: string) => {
      pushHistory();
      setEdges((eds) =>
        eds.map((e) => e.id === id ? { ...e, data: { ...e.data, label: label || undefined } } : e)
      );
    },
    [setEdges, pushHistory]
  );

  const handleAlign = useCallback(
    (type: AlignType) => {
      const selectedIds = new Set(selectedNodes.map((n) => n.id));
      setNodes((nds) => applyAlignment(nds, selectedIds, type));
    },
    [selectedNodes, setNodes]
  );

  const handleFlipNode = useCallback((id: string) => {
    pushHistory();
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? { ...n, data: { ...(n.data as Record<string, unknown>), flipped: !(n.data as Record<string, unknown>).flipped } }
          : n
      )
    );
  }, [setNodes, pushHistory]);

  // Context menu handlers
  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: Node) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'node', targetId: node.id, canFlip: FLIPPABLE_TYPES.has(node.type ?? '') });
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

  // Keyboard shortcuts: Escape, Ctrl+Z/Y/X/C/V, Arrow keys (move selected nodes)
  useEffect(() => {
    const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setContextMenu(null); return; }
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable;

      if (ARROW_KEYS.includes(e.key) && !isEditing) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        if (!isArrowMoving.current) {
          isArrowMoving.current = true;
          pushHistory();
        }
        setNodes(nds =>
          nds.map(n => n.selected ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } } : n)
        );
        return;
      }

      if (e.key === 'Backspace' && !isEditing && onNavigateBack) {
        e.preventDefault();
        onNavigateBack();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !isEditing) {
        if (e.key === 'z') { e.preventDefault(); handleUndo(); }
        else if (e.key === 'y') { e.preventDefault(); handleRedo(); }
        else if (e.key === 'c') { e.preventDefault(); handleCopy(); }
        else if (e.key === 'x') { e.preventDefault(); handleCut(); }
        else if (e.key === 'v') { e.preventDefault(); handlePaste(); }
      }
    };

    const keyUpHandler = (e: KeyboardEvent) => {
      if (ARROW_KEYS.includes(e.key)) {
        isArrowMoving.current = false;
      }
    };

    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', keyUpHandler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('keyup', keyUpHandler);
    };
  }, [handleUndo, handleRedo, handleCopy, handleCut, handlePaste, pushHistory, setNodes, onNavigateBack]);

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
          onMouseMove={(e) => { mouseScreenPos.current = { x: e.clientX, y: e.clientY }; }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode="Delete"
          snapToGrid={snapEnabled}
          snapGrid={[10, 10]}
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
          <Background color="#e2e8f0" gap={10} />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const colors: Record<string, string> = {
                triangleNode: '#e2e8f0',
                sumNode: '#e2e8f0',
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
            onFlipNode={handleFlipNode}
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
