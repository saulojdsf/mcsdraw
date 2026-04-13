import type { NodeTypes, EdgeTypes } from 'reactflow';
import { TriangleNode } from './TriangleNode';
import { SumNode } from './SumNode';
import { MultiplyNode } from './MultiplyNode';
import { DivideNode } from './DivideNode';
import { CustomTextNode } from './CustomTextNode';
import { CustomLatexNode } from './CustomLatexNode';
import { ModuleNode } from './ModuleNode';
import { SwitchNode } from './SwitchNode';
import { TextLabelNode } from './TextLabelNode';
import { GroupRectNode } from './GroupRectNode';
import { LabeledEdge } from './LabeledEdge';

export const nodeTypes: NodeTypes = {
  triangleNode: TriangleNode,
  sumNode: SumNode,
  multiplyNode: MultiplyNode,
  divideNode: DivideNode,
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
