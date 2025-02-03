import { Node } from 'reactflow';
import type { NodeExecutor, WorkflowExecutionContext } from '../engine';

export interface CodeTransformNodeData {
  code: string;
  language: string;
}

export const codeTransformExecutor: NodeExecutor = {
  type: 'codeTransform',
  async execute(node: Node<CodeTransformNodeData>, context: WorkflowExecutionContext) {
    const { code } = node.data;

    if (!code) {
      throw new Error('Code is required for Code Transform node');
    }

    try {
      // Create a safe context with access to previous node results
      const sandbox = {
        input: context.nodeResults,
        result: null,
        console: {
          log: (...args: any[]) => console.log(`[CodeTransform ${node.id}]:`, ...args),
          error: (...args: any[]) => console.error(`[CodeTransform ${node.id}]:`, ...args)
        }
      };

      console.log(`[CodeTransform ${node.id}] Executing code:`, code);

      // Create a new Function with the sandbox as context
      const fn = new Function('sandbox', `
        with (sandbox) {
          try {
            ${code}
            console.log('[CodeTransform Debug] Result after execution:', result);
            if (result === null || result === undefined) {
              throw new Error('Code must set the "result" variable');
            }
          } catch (error) {
            console.error('[CodeTransform Debug] Execution error:', error);
            throw new Error('Code execution failed: ' + error.message);
          }
        }
      `);

      // Execute the function with the sandbox
      fn.call(sandbox, sandbox);

      console.log(`[CodeTransform ${node.id}] Execution result:`, sandbox.result);

      return sandbox.result;
    } catch (error) {
      console.error(`Code transform error in node ${node.id}:`, error);
      throw new Error(`Code transform error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}; 