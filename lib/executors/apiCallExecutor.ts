import { Node } from 'reactflow';
import type { NodeExecutor, WorkflowExecutionContext } from '../engine';

export interface ApiCallNodeData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

export const apiCallExecutor: NodeExecutor = {
  type: 'apiCall',
  async execute(node: Node, context: WorkflowExecutionContext) {
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

      return await response.json();
    } catch (error) {
      throw new Error(`API call error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}; 