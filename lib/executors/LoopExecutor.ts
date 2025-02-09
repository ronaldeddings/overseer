import { Node, Edge } from 'reactflow';
import { LoopNodeData } from '../types/workflow';
import { ExecutionContext } from '../engine/ExecutionContext';
import { NodeExecutor } from './types';

interface ForEachSandboxEnv {
  input: { [key: string]: any };
  result: any[] | null;
}

interface WhileSandboxEnv {
  input: { [key: string]: any };
  result: boolean;
}

class LoopExecutor implements NodeExecutor {
  readonly type = 'loop' as const;
  private workflow: { nodes: Node[]; edges: Edge[] };

  constructor() {
    this.workflow = { nodes: [], edges: [] };
  }

  private async executeNode(nodeId: string, context: ExecutionContext): Promise<void> {
    // This should be implemented by the WorkflowEngine
    throw new Error('executeNode must be implemented by WorkflowEngine');
  }

  async execute(
    node: Node<LoopNodeData>,
    context: ExecutionContext,
    workflow: { nodes: Node[]; edges: Edge[] },
    executeNode: (nodeId: string, context: ExecutionContext) => Promise<void>
  ): Promise<any> {
    this.workflow = workflow;
    this.executeNode = executeNode.bind(this);

    const { loopType, condition, collection, maxIterations = 100 } = node.data;
    let iterations = 0;

    try {
      if (loopType === 'forEach') {
        // Get the collection to iterate over
        const sandboxEnv: ForEachSandboxEnv = {
          input: Object.fromEntries(
            Object.entries(context.getAvailableOutputs(node.id))
              .map(([key, output]) => [key, output.data])
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
          const loopContext = new ExecutionContext(context);
          loopContext.setNodeOutput('loop', {
            iteration: i,
            totalIterations: items.length,
            item: items[i],
            isFirst: i === 0,
            isLast: i === items.length - 1
          });

          // Find and execute all nodes connected to the body handle
          const bodyEdges = this.workflow.edges.filter((edge: Edge) => 
            edge.source === node.id && edge.sourceHandle === 'body'
          );
          const bodyNodes = this.workflow.nodes.filter((n: Node) => 
            bodyEdges.some((edge: Edge) => edge.target === n.id)
          );

          for (const bodyNode of bodyNodes) {
            await this.executeNode(bodyNode.id, loopContext);
          }

          iterations++;
        }
      } else {
        // Execute while condition is true
        while (iterations < maxIterations) {
          const sandboxEnv: WhileSandboxEnv = {
            input: Object.fromEntries(
              Object.entries(context.getAvailableOutputs(node.id))
                .map(([key, output]) => [key, output.data])
            ),
            result: false
          };
          const conditionFn = new Function('with(this) { result = ' + condition + '; }');
          conditionFn.call(sandboxEnv);

          if (!sandboxEnv.result) {
            break;
          }

          const loopContext = new ExecutionContext(context);
          loopContext.setNodeOutput('loop', {
            iteration: iterations,
            totalIterations: maxIterations,
            isFirst: iterations === 0,
            isLast: false
          });

          // Find and execute all nodes connected to the body handle
          const bodyEdges = this.workflow.edges.filter((edge: Edge) => 
            edge.source === node.id && edge.sourceHandle === 'body'
          );
          const bodyNodes = this.workflow.nodes.filter((n: Node) => 
            bodyEdges.some((edge: Edge) => edge.target === n.id)
          );

          for (const bodyNode of bodyNodes) {
            await this.executeNode(bodyNode.id, loopContext);
          }

          iterations++;
        }
      }

      if (iterations >= maxIterations) {
        console.warn(`Loop reached maximum iterations (${maxIterations})`);
      }

      return { iterations, completed: true };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Loop node execution failed: ${error.message}`);
      }
      throw new Error('Loop node execution failed with unknown error');
    }
  }
}

export const loopExecutor = new LoopExecutor(); 