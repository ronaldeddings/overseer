import { Node } from 'reactflow';
import { NodeExecutor, WorkflowExecutionContext } from '../engine';
import { SubWorkflowNodeData } from '@/components/workflows/nodes/SubWorkflowNode';
import { getSupabaseClient } from '@/lib/supabase';

export const subWorkflowExecutor: NodeExecutor = {
  type: 'subWorkflow',
  async execute(node: Node<SubWorkflowNodeData>, context: WorkflowExecutionContext): Promise<any> {
    const { workflowId } = node.data;
    
    if (!workflowId) {
      throw new Error('No workflow ID specified for sub-workflow node');
    }

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Fetch the sub-workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error || !workflow) {
      throw new Error(`Failed to fetch sub-workflow: ${error?.message}`);
    }

    // Create a new context for the sub-workflow
    const subContext: WorkflowExecutionContext = {
      workflowId,
      nodes: workflow.definition.nodes,
      edges: workflow.definition.edges,
      nodeResults: {},
      currentNodeId: null,
      status: 'running',
      // Pass parent context's input data to sub-workflow
      parentContext: {
        nodeId: node.id,
        results: context.nodeResults
      }
    };

    try {
      // Create a new engine instance for the sub-workflow
      const engine = new (await import('../engine')).WorkflowEngine();
      
      // Register all executors for the sub-workflow
      const { 
        apiCallExecutor, 
        codeTransformExecutor, 
        browserActionExecutor,
        subWorkflowExecutor 
      } = await import('./index');
      
      engine.registerNodeExecutor(apiCallExecutor);
      engine.registerNodeExecutor(codeTransformExecutor);
      engine.registerNodeExecutor(browserActionExecutor);
      engine.registerNodeExecutor(subWorkflowExecutor);

      // Execute the sub-workflow
      const result = await engine.runWorkflow(workflowId);

      if (result.status === 'failed') {
        throw result.error || new Error('Sub-workflow execution failed');
      }

      return result.nodeResults;
    } catch (error) {
      throw new Error(`Error executing sub-workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}; 