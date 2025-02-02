import { io } from 'socket.io-client';
import type { BrowserAction, SocketMessage } from '../types/socket';
import { SocketManager } from '../websocket/WebSocketManager';
import { v4 as uuidv4 } from 'uuid';
import { Node } from 'reactflow';
import type { NodeExecutor, WorkflowExecutionContext } from '../engine';

export class BrowserActionExecutor {
  private socketManager: SocketManager;

  constructor() {
    this.socketManager = SocketManager.getInstance();
  }

  public async execute(action: BrowserAction, workflowId: string, nodeId: string): Promise<any> {
    try {
      // Validate action
      if (!action.type || !action.selector) {
        throw new Error('Browser action requires type and selector');
      }

      // Ensure timeout is set
      if (!action.timeout) {
        action.timeout = 30000; // Default 30 seconds
      }

      // Execute action through WebSocket
      const response = await this.socketManager.executeAction({
        type: 'EXECUTE_ACTION',
        id: uuidv4(),
        workflowId,
        nodeId,
        action: {
          type: action.type,
          selector: action.selector,
          value: action.value,
          timeout: action.timeout
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Handle specific action responses
      switch (action.type) {
        case 'scrape':
          return { content: response.result };
        case 'click':
        case 'input':
        case 'wait':
          return { success: true, ...response.result };
        default:
          return response.result;
      }
    } catch (error) {
      throw new Error(`Browser action failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

const browserActionInstance = new BrowserActionExecutor();

export const browserActionExecutor: NodeExecutor = {
  type: 'browserAction',
  async execute(node: Node, context: WorkflowExecutionContext) {
    const { action } = node.data;

    if (!action || typeof action !== 'object') {
      throw new Error('Invalid browser action configuration');
    }

    try {
      const result = await browserActionInstance.execute(action, context.workflowId, node.id);
      
      // Store the result in the context for the next node
      context.nodeResults[node.id] = result;
      
      return result;
    } catch (error) {
      throw new Error(`Browser action error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}; 