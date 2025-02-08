'use client'

import { Node } from 'reactflow'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ApiCallNodeData } from './nodes/ApiCallNode'
import { CodeTransformNodeData } from './nodes/CodeTransformNode'
import { BrowserActionNodeData } from './nodes/BrowserActionNode'
import { SubWorkflowNodeData } from './nodes/SubWorkflowNode'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type NodeData = ApiCallNodeData | CodeTransformNodeData | BrowserActionNodeData | SubWorkflowNodeData

interface NodeConfigPanelProps {
  selectedNode: Node<NodeData> | null
  onNodeDataChange: (nodeId: string, data: NodeData) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function NodeConfigPanel({
  selectedNode,
  onNodeDataChange,
  open,
  onOpenChange,
}: NodeConfigPanelProps) {
  if (!selectedNode) return null

  const handleDataChange = (key: string, value: any) => {
    onNodeDataChange(selectedNode.id, {
      ...selectedNode.data,
      [key]: value,
    })
  }

  const renderApiCallConfig = () => {
    const data = selectedNode.data as ApiCallNodeData
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            value={data.url}
            onChange={(e) => handleDataChange('url', e.target.value)}
            placeholder="https://api.example.com"
          />
        </div>
        <div>
          <Label htmlFor="method">Method</Label>
          <Select
            value={data.method}
            onValueChange={(value) => handleDataChange('method', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="headers">Headers (JSON)</Label>
          <Textarea
            id="headers"
            value={JSON.stringify(data.headers, null, 2)}
            onChange={(e) => {
              try {
                const headers = JSON.parse(e.target.value)
                handleDataChange('headers', headers)
              } catch (error) {
                // Handle invalid JSON
              }
            }}
            placeholder={"{\n  \"Content-Type\": \"application/json\"\n}"}
            className="font-mono"
          />
        </div>
      </div>
    )
  }

  const renderCodeTransformConfig = () => {
    const data = selectedNode.data as CodeTransformNodeData
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="code">Code</Label>
          <Textarea
            id="code"
            value={data.code}
            onChange={(e) => handleDataChange('code', e.target.value)}
            placeholder="// Write your transformation code here..."
            className="min-h-[300px] font-mono"
          />
        </div>
      </div>
    )
  }

  const renderBrowserActionConfig = () => {
    const data = selectedNode.data as BrowserActionNodeData
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="action">Action</Label>
          <Select
            value={data.action}
            onValueChange={(value) => handleDataChange('action', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="click">Click Element</SelectItem>
              <SelectItem value="type">Type Text</SelectItem>
              <SelectItem value="wait">Wait for Element</SelectItem>
              <SelectItem value="scrape">Scrape Content</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="selector">CSS Selector</Label>
          <Input
            id="selector"
            value={data.selector}
            onChange={(e) => handleDataChange('selector', e.target.value)}
            placeholder="#submit-button, .form-input"
          />
        </div>
        {data.action === 'type' && (
          <div>
            <Label htmlFor="value">Text to Type</Label>
            <Input
              id="value"
              value={data.value}
              onChange={(e) => handleDataChange('value', e.target.value)}
              placeholder="Enter text..."
            />
          </div>
        )}
      </div>
    )
  }

  const renderSubWorkflowConfig = () => {
    const data = selectedNode.data as SubWorkflowNodeData
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="workflowId">Workflow</Label>
          <Select
            value={data.workflowId}
            onValueChange={(value) => handleDataChange('workflowId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select workflow" />
            </SelectTrigger>
            <SelectContent>
              {/* Workflow options are handled by the SubWorkflowNode component */}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  const renderNodeConfig = () => {
    switch (selectedNode.type) {
      case 'apiCall':
        return renderApiCallConfig()
      case 'codeTransform':
        return renderCodeTransformConfig()
      case 'browserAction':
        return renderBrowserActionConfig()
      case 'subWorkflow':
        return renderSubWorkflowConfig()
      default:
        return null
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Configure {selectedNode.type}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">{renderNodeConfig()}</div>
      </SheetContent>
    </Sheet>
  )
} 