import { WorkflowEngine, NodeExecutor } from '../lib/engine';
import { apiCallExecutor } from '../lib/executors/apiCallExecutor';
import { codeTransformExecutor } from '../lib/executors/codeTransformExecutor';
import { browserActionExecutor } from '../lib/executors/browserActionExecutor';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-workflow',
              name: 'Test Workflow',
              definition: {
                nodes: [
                  {
                    id: 'node1',
                    type: 'apiCall',
                    data: {
                      url: 'https://api.example.com',
                      method: 'GET'
                    }
                  },
                  {
                    id: 'node2',
                    type: 'codeTransform',
                    data: {
                      code: 'return input.data;'
                    }
                  }
                ],
                edges: [
                  {
                    id: 'edge1',
                    source: 'node1',
                    target: 'node2'
                  }
                ]
              }
            },
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve())
    }))
  }))
}));

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test data' })
  })
) as jest.Mock;

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
    
    // Register node executors
    engine.registerNodeExecutor(apiCallExecutor);
    engine.registerNodeExecutor(codeTransformExecutor);
    engine.registerNodeExecutor(browserActionExecutor);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should execute a workflow successfully', async () => {
    const result = await engine.runWorkflow('test-workflow');
    
    // Log detailed execution information
    console.log('Workflow execution result:', {
      status: result.status,
      error: result.error?.message,
      nodeResults: result.nodeResults,
      currentNodeId: result.currentNodeId
    });
    
    expect(result.status).toBe('completed');
    expect(result.nodeResults).toHaveProperty('node1');
    expect(result.nodeResults).toHaveProperty('node2');
    expect(result.error).toBeUndefined();
  });

  it('should handle workflow execution errors', async () => {
    // Mock fetch to simulate an API error
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('API error'))
    );

    const result = await engine.runWorkflow('test-workflow');
    
    expect(result.status).toBe('failed');
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('API error');
  });

  it('should handle missing node executors', async () => {
    // Create a new engine without registering executors
    const emptyEngine = new WorkflowEngine();
    
    const result = await emptyEngine.runWorkflow('test-workflow');
    
    expect(result.status).toBe('failed');
    expect(result.error?.message).toContain('No executor found for node type');
  });
}); 