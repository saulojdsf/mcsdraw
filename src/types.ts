import type { Node, Edge } from 'reactflow';

export interface Waypoint { x: number; y: number; }

export interface DiagramData {
  nodes: Node[];
  edges: Edge[];
}

export interface NavItem {
  id: string;
  label: string;
}

export type BlockNodeType =
  | 'triangleNode'
  | 'sumNode'
  | 'multiplyNode'
  | 'divideNode'
  | 'customTextNode'
  | 'customLatexNode'
  | 'moduleNode'
  | 'switchNode'
  | 'textLabelNode'
  | 'groupRectNode';

export interface SumNodeData {
  label: string;
  signs: string[];
  color?: string;
  flipped?: boolean;
}

export interface MultiplyNodeData {
  label: string;
  roles: string[]; // '×' or '÷'
  color?: string;
  flipped?: boolean;
}

export interface DivideNodeData {
  label: string;
  roles: string[]; // 'N' or 'D'
  color?: string;
  flipped?: boolean;
}

export interface CustomTextNodeData {
  label: string;
  text: string;
  inputCount: number;
  outputCount: number;
  color?: string;
  flipped?: boolean;
}

export interface CustomLatexNodeData {
  label: string;
  formula: string;
  inputCount: number;
  outputCount: number;
  color?: string;
  flipped?: boolean;
}

export interface SwitchNodeData {
  label: string;
  text: string;
  inputCount: number;
  color?: string;
  flipped?: boolean;
}

export interface ModuleNodeData {
  label: string;
  childDiagramId: string;
  inputCount: number;
  outputCount: number;
  color?: string;
  flipped?: boolean;
}

export interface TextLabelNodeData {
  text: string;
  fontSize: number;
  color?: string;
}

export interface GroupRectNodeData {
  label: string;
  color?: string;
}

export const defaultNodeData: Record<BlockNodeType, Record<string, unknown>> = {
  triangleNode: { label: '', gain: 'K' },
  sumNode: { label: '', signs: ['+', '+'] },
  multiplyNode: { label: '', roles: ['×', '×'] },
  divideNode: { label: '', roles: ['N', 'D'] },
  customTextNode: { label: '', text: 'Text', inputCount: 1, outputCount: 1 },
  customLatexNode: { label: '', formula: '\\frac{1}{s}', inputCount: 1, outputCount: 1 },
  moduleNode: { label: 'Module', childDiagramId: '', inputCount: 1, outputCount: 1 },
  switchNode: { label: '', text: '', inputCount: 2 },
  textLabelNode: { text: 'Label', fontSize: 14 },
  groupRectNode: { label: 'Group' },
};

export const blockLabels: Record<BlockNodeType, string> = {
  triangleNode: 'Triangle',
  sumNode: 'Sum',
  multiplyNode: 'Multiply',
  divideNode: 'Divide',
  customTextNode: 'Custom Text',
  customLatexNode: 'LaTeX Block',
  moduleNode: 'Module',
  switchNode: 'Switch',
  textLabelNode: 'Text Label',
  groupRectNode: 'Group Rect',
};
