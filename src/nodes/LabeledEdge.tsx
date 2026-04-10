import { useContext, useRef } from 'react';
import { EdgeLabelRenderer, BaseEdge, useReactFlow, getSmoothStepPath } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import { EdgeUpdateContext } from '../context/EdgeUpdateContext';
import type { Waypoint } from '../types';

interface LabeledEdgeData {
  label?: string;
  waypoints?: Waypoint[];
}

function buildPath(points: Array<{ x: number; y: number }>): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export function LabeledEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
  markerEnd,
  style,
  selected,
}: EdgeProps<LabeledEdgeData>) {
  const updateWaypoints = useContext(EdgeUpdateContext);
  const { getViewport } = useReactFlow();
  const draggingRef = useRef<{
    wpIndex: number;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const waypoints: Waypoint[] = data?.waypoints ?? [];
  const hasWaypoints = waypoints.length > 0;
  const allPoints = [{ x: sourceX, y: sourceY }, ...waypoints, { x: targetX, y: targetY }];

  // Use smooth-step when unmodified; polyline once waypoints are added
  const [smoothPath, smoothLabelX, smoothLabelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });
  const edgePath = hasWaypoints ? buildPath(allPoints) : smoothPath;

  // Label position
  const midIdx = Math.floor((allPoints.length - 1) / 2);
  const labelX = hasWaypoints ? (allPoints[midIdx].x + allPoints[midIdx + 1].x) / 2 : smoothLabelX;
  const labelY = hasWaypoints ? (allPoints[midIdx].y + allPoints[midIdx + 1].y) / 2 : smoothLabelY;

  // Midpoint handle position for the unmodified case: centre of the smooth path label point
  const defaultMidX = hasWaypoints ? (allPoints[0].x + allPoints[1].x) / 2 : smoothLabelX;
  const defaultMidY = hasWaypoints ? (allPoints[0].y + allPoints[1].y) / 2 : smoothLabelY;

  function startDrag(wpIndex: number, clientX: number, clientY: number, origX: number, origY: number) {
    draggingRef.current = { wpIndex, startClientX: clientX, startClientY: clientY, origX, origY };

    function onMouseMove(e: MouseEvent) {
      const d = draggingRef.current;
      if (!d) return;
      const { zoom } = getViewport();
      const newX = d.origX + (e.clientX - d.startClientX) / zoom;
      const newY = d.origY + (e.clientY - d.startClientY) / zoom;
      updateWaypoints(id, (prev) => {
        const updated = [...prev];
        updated[d.wpIndex] = { x: newX, y: newY };
        return updated;
      });
    }

    function onMouseUp() {
      draggingRef.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function handleWaypointMouseDown(wpIndex: number, e: React.MouseEvent) {
    e.stopPropagation();
    startDrag(wpIndex, e.clientX, e.clientY, waypoints[wpIndex].x, waypoints[wpIndex].y);
  }

  function handleMidpointMouseDown(segIdx: number, e: React.MouseEvent, overrideMid?: { x: number; y: number }) {
    e.stopPropagation();
    const p1 = allPoints[segIdx];
    const p2 = allPoints[segIdx + 1];
    const midX = overrideMid?.x ?? (p1.x + p2.x) / 2;
    const midY = overrideMid?.y ?? (p1.y + p2.y) / 2;
    updateWaypoints(id, (prev) => {
      const updated = [...prev];
      updated.splice(segIdx, 0, { x: midX, y: midY });
      return updated;
    });
    startDrag(segIdx, e.clientX, e.clientY, midX, midY);
  }

  function handleWaypointDoubleClick(wpIndex: number, e: React.MouseEvent) {
    e.stopPropagation();
    updateWaypoints(id, (prev) => {
      const updated = [...prev];
      updated.splice(wpIndex, 1);
      return updated;
    });
  }

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />

      {selected && (
        <EdgeLabelRenderer>
          {/* Midpoint dots — drag to bend the edge.
              When no waypoints yet, show a single dot at the smooth-path centre. */}
          {hasWaypoints
            ? allPoints.slice(0, -1).map((_, segIdx) => {
                const mx = (allPoints[segIdx].x + allPoints[segIdx + 1].x) / 2;
                const my = (allPoints[segIdx].y + allPoints[segIdx + 1].y) / 2;
                return (
                  <div
                    key={`mid-${segIdx}`}
                    className="nopan absolute rounded-full bg-blue-400 border-2 border-white shadow-sm cursor-crosshair opacity-50 hover:opacity-100 transition-opacity"
                    style={{
                      width: 10,
                      height: 10,
                      transform: `translate(-50%, -50%) translate(${mx}px, ${my}px)`,
                      pointerEvents: 'all',
                    }}
                    onMouseDown={(e) => handleMidpointMouseDown(segIdx, e)}
                  />
                );
              })
            : (
              <div
                className="nopan absolute rounded-full bg-blue-400 border-2 border-white shadow-sm cursor-crosshair opacity-50 hover:opacity-100 transition-opacity"
                style={{
                  width: 10,
                  height: 10,
                  transform: `translate(-50%, -50%) translate(${defaultMidX}px, ${defaultMidY}px)`,
                  pointerEvents: 'all',
                }}
                onMouseDown={(e) => handleMidpointMouseDown(0, e, { x: smoothLabelX, y: smoothLabelY })}
              />
            )
          }

          {/* Waypoint handles — drag to reposition, double-click to remove */}
          {waypoints.map((wp, wpIdx) => (
            <div
              key={`wp-${wpIdx}`}
              className="nopan absolute rounded-full bg-blue-500 border-2 border-white shadow cursor-move"
              style={{
                width: 12,
                height: 12,
                transform: `translate(-50%, -50%) translate(${wp.x}px, ${wp.y}px)`,
                pointerEvents: 'all',
              }}
              onMouseDown={(e) => handleWaypointMouseDown(wpIdx, e)}
              onDoubleClick={(e) => handleWaypointDoubleClick(wpIdx, e)}
            />
          ))}
        </EdgeLabelRenderer>
      )}

      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nopan px-1.5 py-0.5 rounded text-[11px] bg-white border border-slate-300 text-slate-700 font-mono shadow-sm select-none"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
