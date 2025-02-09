import { NextApiRequest, NextApiResponse } from 'next';
import { WorkflowEngine } from '@/lib/engine/WorkflowEngine';
import {
  apiCallExecutor,
  codeTransformExecutor,
  browserActionExecutor,
  subWorkflowExecutor,
  conditionalExecutor,
  loopExecutor,
} from '@/lib/executors';
import { getSupabaseClient } from '@/lib/supabase';
import { NodeType } from '@/lib/types/workflow';
import { ExecutionContext } from '@/lib/engine/ExecutionContext';
import { Node, Edge } from 'reactflow';

// Create an adapter for the loop executor to match the expected signature
const loopExecutorAdapter = {
  type: 'loop' as NodeType,
  execute: async (
    node: Node,
    context: ExecutionContext,
    workflow: { nodes: Node[]; edges: Edge[] },
    executeNode: (nodeId: string) => Promise<void>
  ) => {
    return loopExecutor.execute(node, context, workflow, executeNode);
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid workflow ID' });
  }

  try {
    // Get the workflow from Supabase
    const supabase = getSupabaseClient();
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !workflow) {
      throw new Error('Failed to load workflow');
    }

    // Validate workflow definition
    if (!workflow.definition || !workflow.definition.nodes || workflow.definition.nodes.length === 0) {
      throw new Error('Invalid workflow: No nodes found in workflow definition');
    }

    // Create and configure the workflow engine
    const engine = new WorkflowEngine(workflow.definition);
    
    // Register all executors
    engine.registerNodeExecutor(apiCallExecutor);
    engine.registerNodeExecutor(codeTransformExecutor);
    engine.registerNodeExecutor(browserActionExecutor);
    engine.registerNodeExecutor(subWorkflowExecutor);
    engine.registerNodeExecutor(conditionalExecutor);
    engine.registerNodeExecutor(loopExecutorAdapter);

    // Execute the workflow and get the outputs
    const outputs = await engine.execute();
    res.status(200).json(outputs);
  } catch (error) {
    console.error('Workflow execution failed:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
} 