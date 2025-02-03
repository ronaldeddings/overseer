import { Node, Edge } from 'reactflow';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Types for workflow execution
export type WorkflowExecutionContext = {
  workflowId: string;
  nodes: Node[];
  edges: Edge[];
  nodeResults: Record<string, any>;
  currentNodeId: string | null;
  status: 'running' | 'completed' | 'failed';
  error?: Error;
};

export type NodeExecutor = {
  type: string;
  execute: (node: Node, context: WorkflowExecutionContext) => Promise<any>;
};

export class WorkflowEngine {
  private supabase;
  private nodeExecutors: Map<string, NodeExecutor>;

  constructor() {
    // Initialize Supabase client
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    this.nodeExecutors = new Map();
  }

  // Register a node executor for a specific node type
  registerNodeExecutor(executor: NodeExecutor) {
    this.nodeExecutors.set(executor.type, executor);
  }

  // Get the next nodes to execute based on current node and edges
  private getNextNodes(currentNodeId: string, nodes: Node[], edges: Edge[]): Node[] {
    const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
    return nodes.filter(node => outgoingEdges.some(edge => edge.target === node.id));
  }

  // Execute a single node
  private async executeNode(node: Node, context: WorkflowExecutionContext): Promise<any> {
    if (!node.type) {
      throw new Error(`Node ${node.id} has no type`);
    }

    const executor = this.nodeExecutors.get(node.type);
    if (!executor) {
      throw new Error(`No executor found for node type: ${node.type}`);
    }

    try {
      const result = await executor.execute(node, context);
      return result;
    } catch (error) {
      throw new Error(`Error executing node ${node.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Log execution progress
  private async logExecution(context: WorkflowExecutionContext) {
    try {
      await this.supabase.from('execution_logs').insert({
        workflow_id: context.workflowId,
        status: context.status,
        logs: {
          nodeResults: context.nodeResults,
          currentNode: context.currentNodeId,
          error: context.error?.message
        }
      });
    } catch (error) {
      console.error('Failed to log execution:', error);
    }
  }

  // Main workflow execution method
  async runWorkflow(workflowId: string): Promise<WorkflowExecutionContext> {
    // Fetch workflow from Supabase
    const { data: workflow, error } = await this.supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error || !workflow) {
      throw new Error(`Failed to fetch workflow: ${error?.message}`);
    }

    const context: WorkflowExecutionContext = {
      workflowId,
      nodes: workflow.definition.nodes,
      edges: workflow.definition.edges,
      nodeResults: {},
      currentNodeId: null,
      status: 'running'
    };

    try {
      // Find start nodes (nodes with no incoming edges)
      const startNodes = workflow.definition.nodes.filter((node: Node) => 
        !workflow.definition.edges.some((edge: Edge) => edge.target === node.id)
      );

      // Execute workflow starting from each start node
      for (const startNode of startNodes) {
        context.currentNodeId = startNode.id;
        await this.logExecution(context);

        let currentNodes = [startNode];
        while (currentNodes.length > 0) {
          const nextNodes: Node[] = [];
          
          // Execute current level nodes
          for (const node of currentNodes) {
            context.currentNodeId = node.id;
            const result = await this.executeNode(node, context);
            context.nodeResults[node.id] = result;
            
            // Get next nodes to execute
            const nodeNextNodes = this.getNextNodes(node.id, workflow.definition.nodes, workflow.definition.edges);
            nextNodes.push(...nodeNextNodes);
          }
          
          currentNodes = nextNodes;
        }
      }

      context.status = 'completed';
    } catch (error) {
      context.status = 'failed';
      context.error = error as Error;
      console.error('Workflow execution failed:', error);
    }

    // Log final execution state
    await this.logExecution(context);
    return context;
  }
} 