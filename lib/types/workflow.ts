import { Node, Edge } from 'reactflow';

export type NodeType = 'apiCall' | 'codeTransform' | 'browserAction' | 'subWorkflow' | 'conditional' | 'loop';

export interface BaseNodeData {
  id?: string;
  onChange?: (id: string, data: any) => void;
}

export interface ConditionalNodeData extends BaseNodeData {
  type: 'conditional';
  condition: string;
  trueTargetId?: string;
  falseTargetId?: string;
}

export interface LoopNodeData extends BaseNodeData {
  type: 'loop';
  loopType: 'forEach' | 'while';
  condition: string;
  collection?: string; // For forEach loops
  maxIterations?: number; // Safety limit for while loops
  currentIteration?: number;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  created_at?: string;
  updated_at?: string;
}

export interface ScheduledWorkflow extends Workflow {
  schedule: string; // Cron expression
  enabled: boolean;
  last_run?: string;
  next_run?: string;
} 