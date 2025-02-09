import { Node, Edge } from 'reactflow';

export type NodeType = 'apiCall' | 'codeTransform' | 'browserAction' | 'subWorkflow' | 'conditional' | 'loop';

export interface NodeOutput {
  id: string;
  data: any;
  timestamp: string;
}

export interface BaseNodeData {
  id?: string;
  onChange?: (key: string, value: any) => void;
  onConfigure?: () => void;
  availableContext?: Record<string, NodeOutput>;
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