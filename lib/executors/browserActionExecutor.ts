import type { BrowserAction, SocketMessage } from '../types/socket';
import { SocketManager } from '../websocket/WebSocketManager';
import { v4 as uuidv4 } from 'uuid';
import { Node } from 'reactflow';
import type { NodeExecutor, WorkflowExecutionContext } from '../engine';

export class BrowserActionExecutor {
  private socketManager: SocketManager;
  private isServerSide: boolean;

  constructor() {
    this.socketManager = SocketManager.getInstance();
    this.isServerSide = typeof window === 'undefined';
    console.log(`Initializing BrowserActionExecutor (${this.isServerSide ? 'server' : 'client'} side)`);
  }

  public async execute(action: any, workflowId: string, nodeId: string): Promise<any> {
    try {
      console.log(`Executing browser action:`, { action, workflowId, nodeId, isServerSide: this.isServerSide });

      // Validate and normalize the action object
      if (typeof action !== 'object' || action === null) {
        throw new Error('Invalid action: must be an object');
      }

      // Extract the actual action object from the spread string
      const actionType = action.type || (typeof action[0] === 'string' ? action[0] : null);
      
      // Ensure action is a proper object (not a string that got spread)
      const normalizedAction: BrowserAction = {
        type: actionType as BrowserAction['type'],
        selector: action.selector,
        value: action.value,
        timeout: action.timeout || 30000,
        url: action.url
      };

      console.log('Normalized action:', normalizedAction);

      // Skip connection check on server side as it's handled by SocketManager
      if (!this.isServerSide && !this.socketManager.isConnected()) {
        throw new Error(
          'Chrome extension not connected. Please make sure:\n' +
          '1. The Overseer extension is installed\n' +
          '2. The extension is enabled\n' +
          '3. You have reloaded the page after installing/enabling the extension'
        );
      }

      // Validate action
      if (!normalizedAction.type) {
        throw new Error('Browser action requires type');
      }

      // Validate based on action type
      if (normalizedAction.type === 'openTab') {
        if (!normalizedAction.url) {
          throw new Error('URL is required for openTab action');
        }
      } else {
        if (!normalizedAction.selector) {
          throw new Error('Selector is required for this browser action');
        }
      }

      console.log('Executing action through WebSocket:', normalizedAction);

      // Execute action through WebSocket to extension
      const response = await this.socketManager.executeAction({
        type: 'EXECUTE_ACTION',
        id: uuidv4(),
        workflowId,
        nodeId,
        action: normalizedAction
      });

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('Action response:', response);

      // Handle specific action responses
      switch (normalizedAction.type) {
        case 'scrape':
          return { content: response.result };
        case 'openTab':
          return { tabId: response.result?.tabId };
        case 'click':
        case 'input':
        case 'wait':
          return { success: true, ...response.result };
        default:
          return response.result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Browser action failed:', errorMessage);
      throw new Error(`Browser action failed: ${errorMessage}`);
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