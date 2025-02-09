import { Node, Edge } from 'reactflow';
import { ExecutionContext } from './types';
import {
  apiCallExecutor,
  codeTransformExecutor,
  browserActionExecutor,
  subWorkflowExecutor,
  conditionalExecutor,
  loopExecutor,
} from '../executors';

export class WorkflowEngine {
  private nodes: Node[];
  private edges: Edge[];
  private context: ExecutionContext;

  constructor(nodes: Node[], edges: Edge[], workflowId: string) {
    this.nodes = nodes;
    this.edges = edges;
    this.context = {
      workflowId,
      nodeResults: {},
      nodes,
      edges,
      currentNodeId: null,
      status: 'running'
    };
  }

  private getNextNodes(nodeId: string): Node[] {
    const outgoingEdges = this.edges.filter(edge => edge.source === nodeId);
    return outgoingEdges.map(edge => 
      this.nodes.find(node => node.id === edge.target)
    ).filter((node): node is Node => node !== undefined);
  }

  private getNodesBySourceHandle(nodeId: string, handleId: string): Node[] {
    const outgoingEdges = this.edges.filter(
      edge => edge.source === nodeId && edge.sourceHandle === handleId
    );
    return outgoingEdges.map(edge => 
      this.nodes.find(node => node.id === edge.target)
    ).filter((node): node is Node => node !== undefined);
  }

  private async executeNode(nodeId: string, context: ExecutionContext = this.context): Promise<any> {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    try {
      context.currentNodeId = nodeId;
      context.status = 'running';
      let result;

      switch (node.type) {
        case 'apiCall':
          result = await apiCallExecutor.execute(node, context);
          context.nodeResults[nodeId] = { value: result };
          break;
        
        case 'codeTransform':
          result = await codeTransformExecutor.execute(node, context);
          context.nodeResults[nodeId] = { value: result };
          break;
        
        case 'browserAction':
          result = await browserActionExecutor.execute(node, context);
          context.nodeResults[nodeId] = { value: result };
          break;
        
        case 'subWorkflow':
          result = await subWorkflowExecutor.execute(node, context);
          context.nodeResults[nodeId] = { value: result };
          break;
        
        case 'conditional': {
          result = await conditionalExecutor.execute(node, context);
          context.nodeResults[nodeId] = { value: result };
          const nextNodes = result 
            ? this.getNodesBySourceHandle(node.id, 'true')
            : this.getNodesBySourceHandle(node.id, 'false');
          
          for (const nextNode of nextNodes) {
            await this.executeNode(nextNode.id, context);
          }
          break;
        }
        
        case 'loop': {
          await loopExecutor.execute(node, context, this.executeNode.bind(this));
          context.nodeResults[nodeId] = { value: null, completed: true };
          // After loop completes, execute nodes connected to 'next'
          const nextNodes = this.getNodesBySourceHandle(node.id, 'next');
          for (const nextNode of nextNodes) {
            await this.executeNode(nextNode.id, context);
          }
          break;
        }

        default:
          throw new Error(`No executor found for node type: ${node.type}`);
      }

      context.status = 'completed';
      return context.nodeResults[nodeId];
    } catch (error) {
      context.status = 'failed';
      console.error(`Error executing node ${nodeId}:`, error);
      throw error;
    } finally {
      context.currentNodeId = null;
    }
  }

  async execute(): Promise<void> {
    // Find start nodes (nodes with no incoming edges)
    const startNodes = this.nodes.filter(node => 
      !this.edges.some(edge => edge.target === node.id)
    );

    if (startNodes.length === 0) {
      throw new Error('No start nodes found in workflow');
    }

    // Execute each start node
    for (const node of startNodes) {
      await this.executeNode(node.id);
    }
  }
} 