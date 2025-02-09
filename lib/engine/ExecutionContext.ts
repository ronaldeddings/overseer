import { NodeOutput } from '../types/workflow';

export class ExecutionContext {
  private outputs: Record<string, NodeOutput> = {};
  private parentContext?: ExecutionContext;

  constructor(parentContext?: ExecutionContext) {
    this.parentContext = parentContext;
  }

  /**
   * Get the output of a specific node
   */
  getNodeOutput(nodeId: string): NodeOutput | undefined {
    return this.outputs[nodeId] || this.parentContext?.getNodeOutput(nodeId);
  }

  /**
   * Set the output for a node
   */
  setNodeOutput(nodeId: string, data: any): void {
    this.outputs[nodeId] = {
      id: nodeId,
      data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get all available outputs that could be used as input for a node
   * This includes outputs from the current context and any parent contexts
   */
  getAvailableOutputs(currentNodeId: string): Record<string, NodeOutput> {
    const allOutputs = { ...this.outputs };
    
    // Add parent context outputs if they exist
    if (this.parentContext) {
      Object.assign(allOutputs, this.parentContext.getAvailableOutputs(currentNodeId));
    }

    // Remove the current node's output to prevent circular dependencies
    delete allOutputs[currentNodeId];
    
    return allOutputs;
  }

  /**
   * Access nested data using JSON path notation
   */
  getValueByPath(path: string): any {
    const [nodeId, ...pathParts] = path.split('.');
    const nodeOutput = this.getNodeOutput(nodeId);
    
    if (!nodeOutput) return undefined;
    
    return pathParts.reduce((obj, part) => obj?.[part], nodeOutput.data);
  }

  /**
   * Clear all outputs in the current context
   */
  clear(): void {
    this.outputs = {};
  }
} 