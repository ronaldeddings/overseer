import { Node, Edge } from 'reactflow';
import { NodeExecutor } from './types';
import { ExecutionContext } from '../engine/ExecutionContext';
import { interpolateTemplate } from '../utils/template';

export interface ApiCallNodeData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

class ApiCallExecutorImpl implements NodeExecutor {
  readonly type = 'apiCall' as const;

  async execute(
    node: Node<ApiCallNodeData>,
    context: ExecutionContext,
    workflow?: { nodes: Node[]; edges: Edge[] },
    executeNode?: (nodeId: string, context: ExecutionContext) => Promise<void>
  ): Promise<any> {
    const { url, method = 'GET', headers = {}, body } = node.data;

    try {
      // Handle both direct input references and template strings
      let interpolatedUrl = url;
      if (url.includes("input['")) {
        // Handle input reference with possible concatenation
        interpolatedUrl = url.replace(/input\['([^']+)'\]/, (match, nodeId) => {
          const nodeOutput = context.getAvailableOutputs(node.id)[nodeId];
          if (!nodeOutput) {
            throw new Error(`No output found for node ${nodeId}`);
          }
          return nodeOutput.data;
        });
      } else {
        // Handle template strings
        interpolatedUrl = interpolateTemplate(url, context);
      }

      const response = await fetch(interpolatedUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`API call error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const apiCallExecutor = new ApiCallExecutorImpl(); 