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
  | 'gainNode'
  | 'triangleNode'
  | 'integratorNode'
  | 'derivativeNode'
  | 'sumNode'
  | 'multiplyNode'
  | 'divideNode'
  | 'transferFunctionNode'
  | 'customTextNode'
  | 'customLatexNode'
  | 'moduleNode'
  | 'switchNode'
  | 'textLabelNode'
  | 'groupRectNode';

export interface GainNodeData {
  label: string;
  gain: string;
  color?: string;
}

export interface IntegratorNodeData {
  label: string;
  color?: string;
}

export interface DerivativeNodeData {
  label: string;
  color?: string;
}

export interface SumNodeData {
  label: string;
  signs: string[];
  color?: string;
}

export interface MultiplyNodeData {
  label: string;
  roles: string[]; // '×' or '÷'
  color?: string;
}

export interface DivideNodeData {
  label: string;
  roles: string[]; // 'N' or 'D'
  color?: string;
}

export interface TransferFunctionNodeData {
  label: string;
  numerator: string;
  denominator: string;
  color?: string;
}

export interface CustomTextNodeData {
  label: string;
  text: string;
  color?: string;
}

export interface CustomLatexNodeData {
  label: string;
  formula: string;
  inputCount: number;
  color?: string;
}

export interface SwitchNodeData {
  label: string;
  text: string;
  inputCount: number;
  color?: string;
}

export interface ModuleNodeData {
  label: string;
  childDiagramId: string;
  inputCount: number;
  outputCount: number;
  color?: string;
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
  gainNode: { label: '', gain: 'K' },
  triangleNode: { label: '', gain: 'K' },
  integratorNode: { label: '' },
  derivativeNode: { label: '' },
  sumNode: { label: '', signs: ['+', '+'] },
  multiplyNode: { label: '', roles: ['×', '×'] },
  divideNode: { label: '', roles: ['N', 'D'] },
  transferFunctionNode: { label: '', numerator: '1', denominator: 's+1' },
  customTextNode: { label: '', text: 'Text' },
  customLatexNode: { label: '', formula: '\\frac{1}{s}' },
  moduleNode: { label: 'Module', childDiagramId: '', inputCount: 1, outputCount: 1 },
  switchNode: { label: '', text: '', inputCount: 2 },
  textLabelNode: { text: 'Label', fontSize: 14 },
  groupRectNode: { label: 'Group' },
};

export const blockLabels: Record<BlockNodeType, string> = {
  gainNode: 'Gain',
  triangleNode: 'Triangle',
  integratorNode: 'Integrator',
  derivativeNode: 'Derivative',
  sumNode: 'Sum',
  multiplyNode: 'Multiply',
  divideNode: 'Divide',
  transferFunctionNode: 'Transfer Fn',
  customTextNode: 'Custom Text',
  customLatexNode: 'LaTeX Block',
  moduleNode: 'Module',
  switchNode: 'Switch',
  textLabelNode: 'Text Label',
  groupRectNode: 'Group Rect',
};
