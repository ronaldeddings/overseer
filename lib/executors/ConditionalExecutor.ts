import { Node } from 'reactflow';
import { ConditionalNodeData } from '../types/workflow';
import { ExecutionContext } from '../engine/ExecutionContext';
import { NodeExecutor } from './types';

class ConditionalExecutor implements NodeExecutor {
  readonly type = 'conditional' as const;

  async execute(
    node: Node<ConditionalNodeData>,
    context: ExecutionContext
  ): Promise<boolean> {
    try {
      // Create a sandbox environment with access to input data
      const sandboxEnv = {
        input: Object.fromEntries(
          Object.entries(context.getAvailableOutputs(node.id))
            .map(([key, output]) => [key, output.data])
        ),
        result: false
      };

      // Evaluate the condition in a sandbox
      const conditionFn = new Function('with(this) { result = ' + node.data.condition + '; }');
      conditionFn.call(sandboxEnv);

      return sandboxEnv.result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Conditional node execution failed: ${error.message}`);
      }
      throw new Error('Conditional node execution failed with unknown error');
    }
  }
}

export const conditionalExecutor = new ConditionalExecutor(); 