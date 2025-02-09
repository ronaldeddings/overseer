import { Node } from 'reactflow';
import { LoopNodeData } from '../types/workflow';
import { WorkflowExecutionContext } from '../engine';

interface ForEachSandboxEnv {
  input: { [key: string]: any };
  result: any[] | null;
}

interface WhileSandboxEnv {
  input: { [key: string]: any };
  result: boolean;
}

class LoopExecutor {
  async execute(
    node: Node<LoopNodeData>,
    context: WorkflowExecutionContext,
    executeNode: (nodeId: string, ctx: WorkflowExecutionContext) => Promise<any>
  ): Promise<void> {
    const { loopType, condition, collection, maxIterations = 100 } = node.data;
    let iterations = 0;

    try {
      if (loopType === 'forEach') {
        // Get the collection to iterate over
        const sandboxEnv: ForEachSandboxEnv = {
          input: Object.fromEntries(
            Object.entries(context.nodeResults).map(([key, value]) => [key, value.value])
          ),
          result: null
        };
        const collectionFn = new Function('with(this) { result = ' + collection + '; }');
        collectionFn.call(sandboxEnv);
        const items = sandboxEnv.result;

        if (!Array.isArray(items)) {
          throw new Error('Collection must evaluate to an array');
        }

        // Execute the body for each item
        for (let i = 0; i < items.length && i < maxIterations; i++) {
          const loopContext: WorkflowExecutionContext = {
            ...context,
            loopContext: {
              iteration: i,
              totalIterations: items.length,
              item: items[i],
              isFirst: i === 0,
              isLast: i === items.length - 1
            }
          };

          // Find and execute all nodes connected to the body handle
          const bodyEdges = context.edges.filter(edge => 
            edge.source === node.id && edge.sourceHandle === 'body'
          );
          const bodyNodes = context.nodes.filter(n => 
            bodyEdges.some(edge => edge.target === n.id)
          );

          for (const bodyNode of bodyNodes) {
            await executeNode(bodyNode.id, loopContext);
          }

          iterations++;
        }
      } else if (loopType === 'while') {
        // Execute while condition is true
        while (iterations < maxIterations) {
          const sandboxEnv: WhileSandboxEnv = {
            input: Object.fromEntries(
              Object.entries(context.nodeResults).map(([key, value]) => [key, value.value])
            ),
            result: false
          };
          const conditionFn = new Function('with(this) { result = ' + condition + '; }');
          conditionFn.call(sandboxEnv);

          if (!sandboxEnv.result) {
            break;
          }

          const loopContext: WorkflowExecutionContext = {
            ...context,
            loopContext: {
              iteration: iterations,
              totalIterations: maxIterations,
              isFirst: iterations === 0,
              isLast: false
            }
          };

          // Find and execute all nodes connected to the body handle
          const bodyEdges = context.edges.filter(edge => 
            edge.source === node.id && edge.sourceHandle === 'body'
          );
          const bodyNodes = context.nodes.filter(n => 
            bodyEdges.some(edge => edge.target === n.id)
          );

          for (const bodyNode of bodyNodes) {
            await executeNode(bodyNode.id, loopContext);
          }

          iterations++;
        }
      }

      if (iterations >= maxIterations) {
        console.warn(`Loop reached maximum iterations (${maxIterations})`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Loop node execution failed: ${error.message}`);
      }
      throw new Error('Loop node execution failed with unknown error');
    }
  }
}

export const loopExecutor = new LoopExecutor(); 