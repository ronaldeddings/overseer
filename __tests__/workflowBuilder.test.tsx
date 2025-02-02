import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ReactFlowProvider } from 'reactflow'
import WorkflowEditor from '../components/workflows/WorkflowEditor'
import { loadWorkflow, saveWorkflow, updateWorkflow } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

// Mock the required components and modules
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>
}))

jest.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: any) => <input {...props} />
}))

jest.mock('lucide-react', () => ({
  PlusCircle: () => <div>PlusCircle</div>,
  Save: () => <div>Save</div>,
  Play: () => <div>Play</div>,
  X: () => <div data-testid="close-icon">X</div>,
  Settings2: () => <div data-testid="settings-icon">Settings</div>
}))

const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ 
    toast: mockToast,
    toasts: []
  })
}))

jest.mock('reactflow/dist/style.css', () => ({}))

// Mock the Supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  },
  loadWorkflow: jest.fn(),
  saveWorkflow: jest.fn(),
  updateWorkflow: jest.fn(),
}))

// Mock fetch for workflow execution
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock the node components
jest.mock('../components/workflows/nodes/ApiCallNode', () => ({
  __esModule: true,
  default: ({ data }: any) => (
    <div data-testid="api-call-node">
      <input data-testid="url-input" value={data.url || ''} readOnly />
    </div>
  )
}))

jest.mock('../components/workflows/nodes/CodeTransformNode', () => ({
  __esModule: true,
  default: ({ data }: any) => (
    <div data-testid="code-transform-node">
      <textarea data-testid="code-input" value={data.code || ''} readOnly />
    </div>
  )
}))

jest.mock('../components/workflows/nodes/BrowserActionNode', () => ({
  __esModule: true,
  default: ({ data }: any) => (
    <div data-testid="browser-action-node">
      <input data-testid="selector-input" value={data.selector || ''} readOnly />
    </div>
  )
}))

// Wrapper component for tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>
    {children}
    <Toaster />
  </ReactFlowProvider>
)

describe('Workflow Builder UI', () => {
  const mockWorkflowId = '123'
  const mockWorkflow = {
    id: mockWorkflowId,
    name: 'Test Workflow',
    definition: {
      nodes: [
        {
          id: 'codeTransform-2',
          type: 'codeTransform',
          position: { x: 100, y: 100 },
          data: { 
            code: '',
            language: 'javascript',
            onConfigure: jest.fn()
          }
        }
      ],
      edges: []
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(loadWorkflow as jest.Mock).mockResolvedValue(mockWorkflow)
    mockFetch.mockReset()
  })

  it('should load workflow data on mount', async () => {
    await act(async () => {
      render(
        <ReactFlowProvider>
          <WorkflowEditor workflowId={mockWorkflowId} />
          <Toaster />
        </ReactFlowProvider>
      )
    })

    await waitFor(() => {
      expect(loadWorkflow).toHaveBeenCalledWith(mockWorkflowId)
    })
  })

  it('should handle workflow execution', async () => {
    const mockWorkflowWithValidNode = {
      ...mockWorkflow,
      definition: {
        nodes: [
          {
            id: 'codeTransform-2',
            type: 'codeTransform',
            position: { x: 100, y: 100 },
            data: { 
              code: 'return input;',
              language: 'javascript',
              onConfigure: jest.fn()
            }
          }
        ],
        edges: []
      }
    }
    ;(loadWorkflow as jest.Mock).mockResolvedValue(mockWorkflowWithValidNode)

    const mockResponse = { status: 'completed' }
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    })

    await act(async () => {
      render(
        <TestWrapper>
          <WorkflowEditor workflowId={mockWorkflowId} />
        </TestWrapper>
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Run Now')).toBeInTheDocument()
    })

    const executeButton = screen.getByText('Run Now')
    
    await act(async () => {
      fireEvent.click(executeButton)
    })

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Workflow executed successfully'
      })
    })
  })

  it('should handle workflow execution errors', async () => {
    const mockWorkflowWithValidNode = {
      ...mockWorkflow,
      definition: {
        nodes: [
          {
            id: 'codeTransform-2',
            type: 'codeTransform',
            position: { x: 100, y: 100 },
            data: { 
              code: 'return input;',
              language: 'javascript',
              onConfigure: jest.fn()
            }
          }
        ],
        edges: []
      }
    }
    ;(loadWorkflow as jest.Mock).mockResolvedValue(mockWorkflowWithValidNode)

    const mockError = new Error('Execution failed')
    mockFetch.mockRejectedValue(mockError)

    await act(async () => {
      render(
        <TestWrapper>
          <WorkflowEditor workflowId={mockWorkflowId} />
        </TestWrapper>
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Run Now')).toBeInTheDocument()
    })

    const executeButton = screen.getByText('Run Now')
    
    await act(async () => {
      fireEvent.click(executeButton)
    })

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Execution failed',
        variant: 'destructive'
      })
    })
  })

  it('should validate required fields before execution', async () => {
    const mockWorkflowWithEmptyNode = {
      ...mockWorkflow,
      definition: {
        nodes: [
          {
            id: 'codeTransform-2',
            type: 'codeTransform',
            position: { x: 100, y: 100 },
            data: { 
              code: '',
              language: 'javascript',
              onConfigure: jest.fn()
            }
          }
        ],
        edges: []
      }
    }
    ;(loadWorkflow as jest.Mock).mockResolvedValue(mockWorkflowWithEmptyNode)

    await act(async () => {
      render(
        <TestWrapper>
          <WorkflowEditor workflowId={mockWorkflowId} />
        </TestWrapper>
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Run Now')).toBeInTheDocument()
    })

    const executeButton = screen.getByText('Run Now')
    
    await act(async () => {
      fireEvent.click(executeButton)
    })

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Code is required for Code Transform node codeTransform-2',
      variant: 'destructive'
    })
  })

  it('should save new workflow', async () => {
    await act(async () => {
      render(
        <ReactFlowProvider>
          <WorkflowEditor workflowId="new" />
          <Toaster />
        </ReactFlowProvider>
      )
    })

    const nameInput = screen.getByPlaceholderText('Workflow Name')
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'New Test Workflow' } })
    })

    const saveButton = screen.getByText('Save Workflow')
    await act(async () => {
      fireEvent.click(saveButton)
    })

    expect(saveWorkflow).toHaveBeenCalledWith({
      name: 'New Test Workflow',
      definition: {
        nodes: [],
        edges: []
      }
    })

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Workflow saved successfully'
    })
  })

  it('should update existing workflow', async () => {
    await act(async () => {
      render(
        <ReactFlowProvider>
          <WorkflowEditor workflowId={mockWorkflowId} />
          <Toaster />
        </ReactFlowProvider>
      )
    })

    const nameInput = screen.getByPlaceholderText('Workflow Name')
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Updated Workflow' } })
    })

    const saveButton = screen.getByText('Save Workflow')
    await act(async () => {
      fireEvent.click(saveButton)
    })

    expect(updateWorkflow).toHaveBeenCalledWith(mockWorkflowId, {
      name: 'Updated Workflow',
      definition: expect.any(Object)
    })

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Workflow saved successfully'
    })
  })

  it('should prevent saving workflow without a name', async () => {
    await act(async () => {
      render(
        <ReactFlowProvider>
          <WorkflowEditor workflowId="new" />
          <Toaster />
        </ReactFlowProvider>
      )
    })

    const nameInput = screen.getByPlaceholderText('Workflow Name')
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: '' } })
    })

    const saveButton = screen.getByText('Save Workflow')
    await act(async () => {
      fireEvent.click(saveButton)
    })

    expect(saveWorkflow).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Please enter a workflow name',
      variant: 'destructive'
    })
  })

  it('should add a new API Call node', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <WorkflowEditor workflowId={mockWorkflowId} />
        </TestWrapper>
      )
    })

    const apiCallButton = screen.getByRole('button', { name: /API Call/i })
    await act(async () => {
      fireEvent.click(apiCallButton)
    })

    expect(screen.getByTestId('api-call-node')).toBeInTheDocument()
  })

  it('should add a new Code Transform node', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <WorkflowEditor workflowId={mockWorkflowId} />
        </TestWrapper>
      )
    })

    const codeTransformButton = screen.getByRole('button', { name: /Code Transform/i })
    await act(async () => {
      fireEvent.click(codeTransformButton)
    })

    expect(screen.getByTestId('code-transform-node')).toBeInTheDocument()
  })

  it('should prevent execution of unsaved workflow', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <WorkflowEditor workflowId="new" />
        </TestWrapper>
      )
    })

    await waitFor(() => {
      const executeButton = screen.getByText('Run Now').closest('button')
      expect(executeButton).toBeDisabled()
    })
  })
}) 