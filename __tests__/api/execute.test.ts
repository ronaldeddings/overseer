import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/execute/[id]';

// Mock the workflow engine
jest.mock('@/lib/engine', () => ({
  WorkflowEngine: jest.fn().mockImplementation(() => ({
    registerNodeExecutor: jest.fn(),
    runWorkflow: jest.fn().mockImplementation((id) => {
      if (id === 'success-workflow') {
        return Promise.resolve({
          status: 'completed',
          nodeResults: {
            node1: { data: 'test result' }
          }
        });
      } else if (id === 'error-workflow') {
        return Promise.resolve({
          status: 'failed',
          error: new Error('Workflow execution failed'),
          nodeResults: {}
        });
      } else {
        return Promise.reject(new Error('Invalid workflow ID'));
      }
    })
  }))
}));

describe('Workflow Execution API', () => {
  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    });
  });

  it('should return 400 for invalid workflow ID', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: {
        id: ['invalid', 'array']
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid workflow ID'
    });
  });

  it('should successfully execute a workflow', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: {
        id: 'success-workflow'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      status: 'completed',
      nodeResults: {
        node1: { data: 'test result' }
      }
    });
  });

  it('should handle workflow execution errors', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: {
        id: 'error-workflow'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      status: 'failed',
      error: 'Workflow execution failed',
      nodeResults: {}
    });
  });

  it('should handle unexpected errors', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: {
        id: 'invalid-id'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      status: 'failed',
      error: 'Invalid workflow ID'
    });
  });
}); 