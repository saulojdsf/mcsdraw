import type { Node } from 'reactflow';

export type AlignType =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'centerH'
  | 'centerV'
  | 'distributeH'
  | 'distributeV';

const nodeW = (n: Node) => n.width ?? 64;
const nodeH = (n: Node) => n.height ?? 40;

export function applyAlignment(nodes: Node[], selectedIds: Set<string>, type: AlignType): Node[] {
  const selected = nodes.filter((n) => selectedIds.has(n.id));
  if (selected.length < 2) return nodes;

  const newPos: Record<string, { x: number; y: number }> = {};

  switch (type) {
    case 'left': {
      const minX = Math.min(...selected.map((n) => n.position.x));
      selected.forEach((n) => { newPos[n.id] = { x: minX, y: n.position.y }; });
      break;
    }
    case 'right': {
      const maxR = Math.max(...selected.map((n) => n.position.x + nodeW(n)));
      selected.forEach((n) => { newPos[n.id] = { x: maxR - nodeW(n), y: n.position.y }; });
      break;
    }
    case 'top': {
      const minY = Math.min(...selected.map((n) => n.position.y));
      selected.forEach((n) => { newPos[n.id] = { x: n.position.x, y: minY }; });
      break;
    }
    case 'bottom': {
      const maxB = Math.max(...selected.map((n) => n.position.y + nodeH(n)));
      selected.forEach((n) => { newPos[n.id] = { x: n.position.x, y: maxB - nodeH(n) }; });
      break;
    }
    case 'centerH': {
      const avgCY = selected.reduce((s, n) => s + n.position.y + nodeH(n) / 2, 0) / selected.length;
      selected.forEach((n) => { newPos[n.id] = { x: n.position.x, y: avgCY - nodeH(n) / 2 }; });
      break;
    }
    case 'centerV': {
      const avgCX = selected.reduce((s, n) => s + n.position.x + nodeW(n) / 2, 0) / selected.length;
      selected.forEach((n) => { newPos[n.id] = { x: avgCX - nodeW(n) / 2, y: n.position.y }; });
      break;
    }
    case 'distributeH': {
      if (selected.length < 3) return nodes;
      const sorted = [...selected].sort((a, b) => a.position.x - b.position.x);
      const span = sorted[sorted.length - 1].position.x + nodeW(sorted[sorted.length - 1]) - sorted[0].position.x;
      const totalW = sorted.reduce((s, n) => s + nodeW(n), 0);
      const gap = (span - totalW) / (sorted.length - 1);
      let curX = sorted[0].position.x;
      sorted.forEach((n) => { newPos[n.id] = { x: curX, y: n.position.y }; curX += nodeW(n) + gap; });
      break;
    }
    case 'distributeV': {
      if (selected.length < 3) return nodes;
      const sorted = [...selected].sort((a, b) => a.position.y - b.position.y);
      const span = sorted[sorted.length - 1].position.y + nodeH(sorted[sorted.length - 1]) - sorted[0].position.y;
      const totalH = sorted.reduce((s, n) => s + nodeH(n), 0);
      const gap = (span - totalH) / (sorted.length - 1);
      let curY = sorted[0].position.y;
      sorted.forEach((n) => { newPos[n.id] = { x: n.position.x, y: curY }; curY += nodeH(n) + gap; });
      break;
    }
  }

  return nodes.map((n) =>
    selectedIds.has(n.id) && newPos[n.id] ? { ...n, position: newPos[n.id] } : n
  );
}
