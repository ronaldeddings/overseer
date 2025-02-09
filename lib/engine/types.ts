import { Node, Edge } from 'reactflow';
import { NodeType } from '../types/workflow';
import { ExecutionContext } from './ExecutionContext';

export interface NodeResult {
  value: any;
  completed?: boolean;
}

export interface LoopContext {
  index: number;
  item?: any;
  isFirst: boolean;
  isLast?: boolean;
}

export interface ParentContext {
  nodeId: string;
  results: Record<string, any>;
}

export interface ExecutionContext {
  workflowId: string;
  nodeResults: { [nodeId: string]: NodeResult };
  loopContext?: LoopContext;
  parentContext?: ParentContext;
  nodes: Node[];
  edges: Edge[];
  currentNodeId: string | null;
  status: 'running' | 'completed' | 'failed';
}

export interface NodeExecutor {
  type: NodeType;
  execute(node: Node, context: ExecutionContext): Promise<any>;
} 