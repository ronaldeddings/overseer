import { Node, Edge } from 'reactflow';
import { NodeType } from '../types/workflow';
import { ExecutionContext } from '../engine/ExecutionContext';

export interface NodeExecutor {
  type: NodeType;
  execute(
    node: Node,
    context: ExecutionContext,
    workflow?: { nodes: Node[]; edges: Edge[] },
    executeNode?: (nodeId: string, context: ExecutionContext) => Promise<void>
  ): Promise<any>;
} 