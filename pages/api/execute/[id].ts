import { NextApiRequest, NextApiResponse } from 'next';
import { WorkflowEngine } from '@/lib/engine';
import { apiCallExecutor, codeTransformExecutor, browserActionExecutor } from '@/lib/executors';

// Initialize and configure the workflow engine
const engine = new WorkflowEngine();
engine.registerNodeExecutor(apiCallExecutor);
engine.registerNodeExecutor(codeTransformExecutor);
engine.registerNodeExecutor(browserActionExecutor);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: 'Invalid workflow ID' });
    }

    // Execute the workflow
    const result = await engine.runWorkflow(id);

    // Return appropriate response based on execution status
    if (result.status === 'completed') {
      return res.status(200).json({
        status: result.status,
        nodeResults: result.nodeResults,
      });
    } else {
      return res.status(500).json({
        status: result.status,
        error: result.error?.message,
        nodeResults: result.nodeResults,
      });
    }
  } catch (error) {
    console.error('Workflow execution error:', error);
    return res.status(500).json({
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
} 