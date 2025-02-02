export type BrowserAction = {
  type: 'click' | 'input' | 'scrape' | 'wait';
  selector: string;
  value?: string;
  timeout?: number;
};

export type BrowserActionResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

export type Message = {
  type: 'EXECUTE_ACTION';
  action: BrowserAction;
  workflowId: string;
  nodeId: string;
} | {
  type: 'ACTION_RESPONSE';
  response: BrowserActionResponse;
  workflowId: string;
  nodeId: string;
} | {
  type: 'HANDSHAKE';
  status: 'connected' | 'disconnected';
};

export type SocketMessage = {
  type: 'EXECUTE_ACTION' | 'ACTION_RESPONSE';
  id: string;
  workflowId?: string;
  nodeId?: string;
  action?: BrowserAction;
  result?: any;
  error?: string;
};

export interface ExecuteScriptDetails {
  code?: string;
  file?: string;
  allFrames?: boolean;
  frameId?: number;
  matchAboutBlank?: boolean;
  runAt?: 'document_start' | 'document_end' | 'document_idle';
  world?: 'ISOLATED' | 'MAIN';
} 