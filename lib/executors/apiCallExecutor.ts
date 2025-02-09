import { Node, Edge } from 'reactflow';
import { NodeExecutor } from './types';
import { ExecutionContext } from '../engine/ExecutionContext';

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
      const response = await fetch(url, {
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