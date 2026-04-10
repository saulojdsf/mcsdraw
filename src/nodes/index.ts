import type { NodeTypes, EdgeTypes } from 'reactflow';
import { GainNode } from './GainNode';
import { TriangleNode } from './TriangleNode';
import { IntegratorNode } from './IntegratorNode';
import { DerivativeNode } from './DerivativeNode';
import { SumNode } from './SumNode';
import { MultiplyNode } from './MultiplyNode';
import { DivideNode } from './DivideNode';
import { TransferFunctionNode } from './TransferFunctionNode';
import { CustomTextNode } from './CustomTextNode';
import { CustomLatexNode } from './CustomLatexNode';
import { ModuleNode } from './ModuleNode';
import { SwitchNode } from './SwitchNode';
import { TextLabelNode } from './TextLabelNode';
import { GroupRectNode } from './GroupRectNode';
import { LabeledEdge } from './LabeledEdge';

export const nodeTypes: NodeTypes = {
  gainNode: GainNode,
  triangleNode: TriangleNode,
  integratorNode: IntegratorNode,
  derivativeNode: DerivativeNode,
  sumNode: SumNode,
  multiplyNode: MultiplyNode,
  divideNode: DivideNode,
  transferFunctionNode: TransferFunctionNode,
  customTextNode: CustomTextNode,
  customLatexNode: CustomLatexNode,
  moduleNode: ModuleNode,
  switchNode: SwitchNode,
  textLabelNode: TextLabelNode,
  groupRectNode: GroupRectNode,
};

export const edgeTypes: EdgeTypes = {
  labeled: LabeledEdge,
};
