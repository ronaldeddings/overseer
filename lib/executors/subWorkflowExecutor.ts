import { Node } from 'reactflow';
import { NodeExecutor } from './types';
import { ExecutionContext } from '../engine/ExecutionContext';
import { getSupabaseClient } from '@/lib/supabase';
import { WorkflowEngine } from '../engine/WorkflowEngine';

export interface SubWorkflowNodeData {
  workflowId: string;
}

class SubWorkflowExecutorImpl implements NodeExecutor {
  readonly type = 'subWorkflow' as const;

  async execute(node: Node<SubWorkflowNodeData>, context: ExecutionContext): Promise<any> {
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

    try {
      // Create a new engine instance for the sub-workflow
      const engine = new WorkflowEngine(workflow, context);
      
      // Execute the sub-workflow
      await engine.execute();

      // Return all outputs from the sub-workflow context
      return engine.getOutputs();
    } catch (error) {
      throw new Error(`Error executing sub-workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const subWorkflowExecutor = new SubWorkflowExecutorImpl(); 