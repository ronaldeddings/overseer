export type BrowserAction = {
  type: 'click' | 'input' | 'scrape' | 'wait';
  selector: string;
  value?: string;
  timeout?: number;
};

export type SocketMessage = {
  type: 'EXECUTE_ACTION' | 'ACTION_RESPONSE' | 'TEST';
  id: string;
  workflowId?: string;
  nodeId?: string;
  action?: BrowserAction;
  result?: any;
  error?: string;
  data?: string;
}; 