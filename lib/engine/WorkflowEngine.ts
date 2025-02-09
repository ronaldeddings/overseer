import { Workflow, NodeType } from '../types/workflow';
import { ExecutionContext } from './ExecutionContext';
import { interpolateTemplate } from '../utils/template';
import type { NodeExecutor } from '../executors/types';
import {
  apiCallExecutor,
  codeTransformExecutor,
  browserActionExecutor,
  subWorkflowExecutor,
  conditionalExecutor,
  loopExecutor
} from '../executors';

export class WorkflowEngine {
  private workflow: Workflow;
  private context: ExecutionContext;
  private executors: Map<NodeType, NodeExecutor>;

  constructor(workflow: Workflow, parentContext?: ExecutionContext) {
    this.workflow = workflow;
    this.context = new ExecutionContext(parentContext);
    this.executors = new Map();
  }

  registerNodeExecutor(executor: NodeExecutor) {
    this.executors.set(executor.type, executor);
  }

  async execute(startNodeId?: string): Promise<Record<string, any>> {
    // Clear any previous execution data
    this.context.clear();

    // Validate workflow has nodes
    if (!this.workflow.nodes || this.workflow.nodes.length === 0) {
      throw new Error('Workflow has no nodes');
    }

    const startNode = startNodeId 
      ? this.workflow.nodes.find(node => node.id === startNodeId)
      : this.workflow.nodes[0];

    if (!startNode) {
      throw new Error('Start node not found');
    }

    await this.executeNode(startNode.id);
    return this.getOutputs();
  }

  /**
   * Get all outputs from the current execution context
   */
  getOutputs(): Record<string, any> {
    const outputs = this.context.getAvailableOutputs('');
    // Return the data directly from each output
    return Object.fromEntries(
      Object.entries(outputs).map(([key, output]) => [key, output.data])
    );
  }

  private async executeNode(nodeId: string): Promise<void> {
    const node = this.workflow.nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    try {
      console.log(`Executing node ${nodeId} with inputs:`, this.context.getAvailableOutputs(nodeId));

      // Get the appropriate executor for this node type
      const executor = this.executors.get(node.type as NodeType);
      if (!executor) {
        throw new Error(`No executor found for node type: ${node.type}`);
      }

      // Execute the node and store its output
      const result = await executor.execute(
        node,
        this.context,
        { nodes: this.workflow.nodes, edges: this.workflow.edges },
        this.executeNode.bind(this)
      );

      // Store the result directly in the context
      this.context.setNodeOutput(nodeId, result);

      // Find and execute next nodes
      const nextNodes = this.workflow.edges
        .filter(edge => edge.source === nodeId)
        .map(edge => edge.target);

      for (const nextNodeId of nextNodes) {
        await this.executeNode(nextNodeId);
      }
    } catch (error) {
      console.error(`Error executing node ${nodeId}:`, error);
      throw error;
    }
  }

  // Helper method to interpolate template strings in node configurations
  protected interpolateNodeConfig(config: any): any {
    if (typeof config === 'string') {
      return interpolateTemplate(config, this.context);
    }
    
    if (Array.isArray(config)) {
      return config.map(item => this.interpolateNodeConfig(item));
    }
    
    if (typeof config === 'object' && config !== null) {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(config)) {
        result[key] = this.interpolateNodeConfig(value);
      }
      return result;
    }
    
    return config;
  }
} 