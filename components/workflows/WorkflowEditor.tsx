'use client'

import { useCallback, useState, useEffect } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeProps,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusCircle, Save, Play } from 'lucide-react'
import ApiCallNode from './nodes/ApiCallNode'
import CodeTransformNode from './nodes/CodeTransformNode'
import BrowserActionNode from './nodes/BrowserActionNode'
import NodeConfigPanel from './NodeConfigPanel'
import { loadWorkflow, saveWorkflow, updateWorkflow } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

const nodeTypes = {
  apiCall: ApiCallNode,
  codeTransform: CodeTransformNode,
  browserAction: BrowserActionNode,
}

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

interface WorkflowEditorProps {
  workflowId: string
}

export default function WorkflowEditor({ workflowId }: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [configPanelOpen, setConfigPanelOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [workflowName, setWorkflowName] = useState('New Workflow')
  const { toast } = useToast()

  useEffect(() => {
    if (workflowId !== 'new') {
      loadWorkflowData()
    }
  }, [workflowId])

  const loadWorkflowData = async () => {
    try {
      setIsLoading(true)
      const workflow = await loadWorkflow(workflowId)
      if (workflow) {
        setWorkflowName(workflow.name)
        if (workflow.definition) {
          setNodes(workflow.definition.nodes)
          setEdges(workflow.definition.edges)
        }
      }
    } catch (error) {
      console.error('Error loading workflow:', error)
      toast({
        title: 'Error',
        description: 'Failed to load workflow',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!workflowName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a workflow name',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsLoading(true)
      const workflow = {
        name: workflowName,
        definition: {
          nodes,
          edges,
        },
      }

      if (workflowId === 'new') {
        await saveWorkflow(workflow)
      } else {
        await updateWorkflow(workflowId, workflow)
      }

      toast({
        title: 'Success',
        description: 'Workflow saved successfully',
      })
    } catch (error) {
      console.error('Error saving workflow:', error)
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateNodes = () => {
    for (const node of nodes) {
      switch (node.type) {
        case 'apiCall':
          if (!node.data.url) {
            throw new Error(`URL is required for API Call node ${node.id}`)
          }
          break
        case 'codeTransform':
          if (!node.data.code) {
            throw new Error(`Code is required for Code Transform node ${node.id}`)
          }
          break
        case 'browserAction':
          if (!node.data.selector) {
            throw new Error(`Selector is required for Browser Action node ${node.id}`)
          }
          break
      }
    }
  }

  const handleExecute = async () => {
    if (workflowId === 'new') {
      toast({
        title: 'Error',
        description: 'Please save the workflow before executing',
        variant: 'destructive',
      })
      return
    }

    try {
      // Validate nodes before execution
      validateNodes()

      setIsExecuting(true)
      const response = await fetch(`/api/execute/${workflowId}`, {
        method: 'POST',
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Workflow executed successfully',
        })
      } else {
        throw new Error(result.error || 'Failed to execute workflow')
      }
    } catch (error) {
      console.error('Error executing workflow:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to execute workflow',
        variant: 'destructive',
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const addNode = useCallback((type: string) => {
    const position = { x: 100, y: nodes.length * 150 }
    const newNode: Node = {
      id: `${type}-${nodes.length + 1}`,
      type,
      position,
      data: {
        url: '',
        method: 'GET',
        headers: {},
        code: '',
        language: 'javascript',
        action: 'click',
        selector: '',
      },
    }
    setNodes((nds) => [...nds, newNode])
  }, [nodes, setNodes])

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const handleNodeDataChange = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...newData, onConfigure: node.data.onConfigure } } : node
      )
    )
  }, [setNodes])

  const handleConfigureClick = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      setSelectedNode(node)
      setConfigPanelOpen(true)
    }
  }, [nodes])

  const handleInputChange = useCallback((nodeId: string, key: string, value: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                [key]: value,
              },
            }
          : node
      )
    )
  }, [setNodes])

  return (
    <div className="h-full w-full relative">
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-lg border shadow-sm">
          <Input
            placeholder="Workflow Name"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="mb-4"
          />
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => addNode('apiCall')}
            >
              <PlusCircle className="h-4 w-4" />
              API Call
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => addNode('codeTransform')}
            >
              <PlusCircle className="h-4 w-4" />
              Code Transform
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => addNode('browserAction')}
            >
              <PlusCircle className="h-4 w-4" />
              Browser Action
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-2"
              onClick={handleSave}
              disabled={isLoading}
            >
              <Save className="h-4 w-4" />
              Save Workflow
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-2"
              onClick={handleExecute}
              disabled={isExecuting || workflowId === 'new'}
            >
              {isExecuting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Now
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      <ReactFlow
        nodes={nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onConfigure: () => handleConfigureClick(node.id),
            onChange: (key: string, value: any) => handleInputChange(node.id, key, value),
          }
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
      </ReactFlow>
      <NodeConfigPanel
        selectedNode={selectedNode}
        onNodeDataChange={handleNodeDataChange}
        open={configPanelOpen}
        onOpenChange={setConfigPanelOpen}
      />
    </div>
  )
} 