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
  parentContext?: {
    nodeId: string;
    results: Record<string, any>;
  };
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

  // Get all input nodes that connect to this node
  private getInputNodes(nodeId: string, nodes: Node[], edges: Edge[]): Node[] {
    const incomingEdges = edges.filter(edge => edge.target === nodeId);
    return nodes.filter(node => incomingEdges.some(edge => edge.source === node.id));
  }

  // Get all output nodes that this node connects to
  private getOutputNodes(nodeId: string, nodes: Node[], edges: Edge[]): Node[] {
    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    return nodes.filter(node => outgoingEdges.some(edge => edge.target === node.id));
  }

  // Get nodes that have no incoming edges
  private getStartNodes(nodes: Node[], edges: Edge[]): Node[] {
    return nodes.filter(node => !edges.some(edge => edge.target === node.id));
  }

  // Create a context specific to a node with only its input nodes' results
  private createNodeContext(node: Node, context: WorkflowExecutionContext): WorkflowExecutionContext {
    const inputNodes = this.getInputNodes(node.id, context.nodes, context.edges);
    const nodeResults: Record<string, any> = {};
    
    // Only include results from direct input nodes
    inputNodes.forEach(inputNode => {
      if (context.nodeResults[inputNode.id] !== undefined) {
        nodeResults[inputNode.id] = context.nodeResults[inputNode.id];
      }
    });

    return {
      ...context,
      nodeResults
    };
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
      // Create a node-specific context with only its input nodes' results
      const nodeContext = this.createNodeContext(node, context);
      console.log(`Executing node ${node.id} with inputs:`, nodeContext.nodeResults);
      
      const result = await executor.execute(node, nodeContext);
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
      // Track executed nodes to prevent cycles
      const executedNodes = new Set<string>();
      
      // Get start nodes (nodes with no incoming edges)
      const startNodes = this.getStartNodes(workflow.definition.nodes, workflow.definition.edges);
      
      // Function to execute a node and its descendants
      const executeNodeAndDescendants = async (node: Node) => {
        if (executedNodes.has(node.id)) {
          return; // Skip if already executed
        }
        
        // Get input nodes and ensure they're all executed
        const inputNodes = this.getInputNodes(node.id, context.nodes, context.edges);
        for (const inputNode of inputNodes) {
          if (!executedNodes.has(inputNode.id)) {
            await executeNodeAndDescendants(inputNode);
          }
        }
        
        // Execute current node
        context.currentNodeId = node.id;
        const result = await this.executeNode(node, context);
        context.nodeResults[node.id] = result;
        executedNodes.add(node.id);
        
        // Execute output nodes
        const outputNodes = this.getOutputNodes(node.id, context.nodes, context.edges);
        for (const outputNode of outputNodes) {
          await executeNodeAndDescendants(outputNode);
        }
      };
      
      // Execute workflow starting from each start node
      for (const startNode of startNodes) {
        await executeNodeAndDescendants(startNode);
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