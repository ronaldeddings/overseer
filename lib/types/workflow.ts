import { Node, Edge } from 'reactflow';

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