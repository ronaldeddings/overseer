import { Node } from 'reactflow';
import type { NodeExecutor, WorkflowExecutionContext } from '../engine';

export interface CodeTransformNodeData {
  code: string;
  input?: any;
}

export const codeTransformExecutor: NodeExecutor = {
  type: 'codeTransform',
  async execute(node: Node, context: WorkflowExecutionContext) {
    const { code } = node.data;

    if (!code) {
      throw new Error('Code is required for Code Transform node');
    }

    try {
      // Create a safe context with access to previous node results
      const sandbox = {
        input: context.nodeResults,
        result: null
      };

      // Create a new Function with the sandbox as context
      const fn = new Function('input', `
        try {
          ${code}
        } catch (error) {
          throw new Error('Code execution failed: ' + error.message);
        }
      `);

      // Execute the function with the sandbox
      fn.call(sandbox, sandbox.input);

      return sandbox.result;
    } catch (error) {
      throw new Error(`Code transform error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}; 