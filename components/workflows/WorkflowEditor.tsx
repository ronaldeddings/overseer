'use client'

import React, { useCallback, useState, useEffect, useMemo } from 'react'
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
import { PlusCircle, Save, Play, Database } from 'lucide-react'
import { NodeConfigPanel } from './NodeConfigPanel'
import { ContextPanel } from './ContextPanel'
import { loadWorkflow, saveWorkflow, updateWorkflow } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { NodeOutput } from '@/lib/types/workflow'
import { ExecutionContext } from '@/lib/engine/ExecutionContext'

// Node type components
import ApiCallNode from './nodes/ApiCallNode'
import CodeTransformNode from './nodes/CodeTransformNode'
import BrowserActionNode from './nodes/BrowserActionNode'
import SubWorkflowNode from './nodes/SubWorkflowNode'
import { ConditionalNode } from './nodes/ConditionalNode'
import { LoopNode } from './nodes/LoopNode'

const nodeTypes = {
  apiCall: ApiCallNode,
  codeTransform: CodeTransformNode,
  browserAction: BrowserActionNode,
  subWorkflow: SubWorkflowNode,
  conditional: ConditionalNode,
  loop: LoopNode,
} as const

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

interface WorkflowEditorProps {
  workflowId: string
  initialNodes?: Node[]
  initialEdges?: Edge[]
}

export function WorkflowEditor({ workflowId, initialNodes = [], initialEdges = [] }: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [workflowName, setWorkflowName] = useState('New Workflow')
  const { toast } = useToast()
  const [context] = useState(() => new ExecutionContext())
  const [outputs, setOutputs] = useState<Record<string, NodeOutput>>({})
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(false)

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
      setIsExecuting(true)
      const response = await fetch(`/api/execute/${workflowId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to execute workflow')
      }

      const result = await response.json()
      
      // Transform the execution results into NodeOutput format
      const formattedOutputs: Record<string, NodeOutput> = {}
      for (const [nodeId, data] of Object.entries(result)) {
        formattedOutputs[nodeId] = {
          id: nodeId,
          data,
          timestamp: new Date().toISOString()
        }
      }
      
      setOutputs(formattedOutputs)
      setIsContextPanelOpen(true) // Automatically open the context panel

      toast({
        title: 'Success',
        description: 'Workflow executed successfully',
      })
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
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Don't set selectedNode here - we only want to do that when configure is clicked
  }, [])

  const handleNodeConfigure = useCallback((node: Node) => {
    setSelectedNode(node)
  }, [])

  const handleNodeDataChange = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...data
            }
          }
        }
        return node
      })
    )
  }, [setNodes])

  // Add onConfigure to each node's data
  const nodesWithConfig = useMemo(() => 
    nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onConfigure: () => handleNodeConfigure(node),
        onChange: (key: string, value: any) => handleNodeDataChange(node.id, { [key]: value }),
        availableContext: outputs
      }
    }))
  , [nodes, handleNodeConfigure, handleNodeDataChange, outputs])

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-4 left-4 z-10 flex gap-2 items-center">
        <Input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="w-64"
          placeholder="Workflow Name"
        />
        <Button
          onClick={handleSave}
          disabled={isLoading}
          variant="outline"
          size="icon"
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleExecute}
          disabled={isExecuting || isLoading}
          variant="outline"
          size="icon"
        >
          <Play className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => setIsContextPanelOpen(true)}
          variant="outline"
          size="icon"
          className="ml-2"
        >
          <Database className="h-4 w-4" />
        </Button>
      </div>

      <ReactFlow
        nodes={nodesWithConfig}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>

      <NodeConfigPanel
        node={selectedNode}
        availableContext={outputs}
        onClose={() => setSelectedNode(null)}
        onChange={handleNodeDataChange}
      />

      <ContextPanel
        outputs={outputs}
        onSelect={(path) => {
          // Optional: Handle context variable selection
          console.log('Selected context path:', path);
        }}
        isOpen={isContextPanelOpen}
        onOpenChange={setIsContextPanelOpen}
      />
    </div>
  )
} 