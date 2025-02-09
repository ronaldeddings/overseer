import { NextApiRequest, NextApiResponse } from 'next';
import { WorkflowEngine } from '@/lib/engine';
import {
  apiCallExecutor,
  codeTransformExecutor,
  browserActionExecutor,
  subWorkflowExecutor,
  conditionalExecutor,
  loopExecutor,
} from '@/lib/executors';

// Create an adapter for the loop executor to match the expected signature
const loopExecutorAdapter = {
  type: 'loop',
  execute: async (node: any, context: any) => {
    // The third argument is a function that executes a node in the context
    const executeNode = async (nodeId: string, ctx: any) => {
      const nodeToExecute = context.nodes.find((n: any) => n.id === nodeId);
      if (!nodeToExecute) {
        throw new Error(`Node ${nodeId} not found`);
      }
      const executor = context.nodeExecutors.get(nodeToExecute.type);
      if (!executor) {
        throw new Error(`No executor found for node type: ${nodeToExecute.type}`);
      }
      return executor.execute(nodeToExecute, ctx);
    };

    return loopExecutor.execute(node, context, executeNode);
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
    const engine = new WorkflowEngine();
    
    // Register all executors
    engine.registerNodeExecutor({
      type: 'apiCall',
      execute: apiCallExecutor.execute.bind(apiCallExecutor)
    });
    
    engine.registerNodeExecutor({
      type: 'codeTransform',
      execute: codeTransformExecutor.execute.bind(codeTransformExecutor)
    });
    
    engine.registerNodeExecutor({
      type: 'browserAction',
      execute: browserActionExecutor.execute.bind(browserActionExecutor)
    });
    
    engine.registerNodeExecutor({
      type: 'subWorkflow',
      execute: subWorkflowExecutor.execute.bind(subWorkflowExecutor)
    });
    
    engine.registerNodeExecutor({
      type: 'conditional',
      execute: conditionalExecutor.execute.bind(conditionalExecutor)
    });
    
    // Register the loop executor adapter instead of the raw executor
    engine.registerNodeExecutor(loopExecutorAdapter);

    const result = await engine.runWorkflow(id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Workflow execution failed:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
} 