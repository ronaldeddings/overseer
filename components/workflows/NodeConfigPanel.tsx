'use client'

import React from 'react'
import { Node } from 'reactflow'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { InputBuilder } from './InputBuilder'
import { NodeOutput } from '@/lib/types/workflow'
import { ApiCallNodeData } from '@/lib/executors/apiCallExecutor'
import { CodeTransformNodeData } from '@/lib/executors/codeTransformExecutor'
import { BrowserActionNodeData } from '@/lib/executors/browserActionExecutor'

interface NodeConfigPanelProps {
  node: Node | null
  availableContext: Record<string, NodeOutput>
  onClose: () => void
  onChange: (nodeId: string, data: any) => void
}

export function NodeConfigPanel({
  node,
  availableContext,
  onClose,
  onChange
}: NodeConfigPanelProps) {
  if (!node) return null

  const handleChange = (key: string, value: any) => {
    onChange(node.id, {
      ...node.data,
      [key]: value
    })
  }

  const renderApiCallConfig = (data: ApiCallNodeData) => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">URL</label>
        <InputBuilder
          value={data.url || ''}
          onChange={(value) => handleChange('url', value)}
          availableContext={availableContext}
          placeholder="https://api.example.com/endpoint"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Method</label>
        <select
          value={data.method || 'GET'}
          onChange={(e) => handleChange('method', e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Headers (JSON)</label>
        <InputBuilder
          value={JSON.stringify(data.headers || {}, null, 2)}
          onChange={(value) => {
            try {
              handleChange('headers', JSON.parse(value))
            } catch (e) {
              // Invalid JSON, ignore
            }
          }}
          availableContext={availableContext}
          placeholder="{}"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Body (JSON)</label>
        <InputBuilder
          value={JSON.stringify(data.body || {}, null, 2)}
          onChange={(value) => {
            try {
              handleChange('body', JSON.parse(value))
            } catch (e) {
              // Invalid JSON, ignore
            }
          }}
          availableContext={availableContext}
          placeholder="{}"
        />
      </div>
    </div>
  )

  const renderCodeTransformConfig = (data: CodeTransformNodeData) => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Code</label>
        <div className="text-xs text-muted-foreground mb-2">
          Access previous node outputs via the 'input' object. Must set 'result' variable.
        </div>
        <textarea
          value={data.code || ''}
          onChange={(e) => handleChange('code', e.target.value)}
          className="w-full h-48 font-mono text-sm rounded-md border border-input bg-background px-3 py-2"
          placeholder="// Example:&#10;result = input.apiCall.data.map(item => item.id);"
        />
      </div>
    </div>
  )

  const renderBrowserActionConfig = (data: BrowserActionNodeData) => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Action Type</label>
        <select
          value={data.action?.type || 'click'}
          onChange={(e) => handleChange('action', { ...data.action, type: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="click">Click</option>
          <option value="input">Input Text</option>
          <option value="scrape">Scrape Content</option>
          <option value="wait">Wait for Element</option>
          <option value="openTab">Open Tab</option>
        </select>
      </div>
      {data.action?.type !== 'openTab' && (
        <div>
          <label className="text-sm font-medium">CSS Selector</label>
          <InputBuilder
            value={data.action?.selector || ''}
            onChange={(value) => handleChange('action', { ...data.action, selector: value })}
            availableContext={availableContext}
            placeholder="#element-id or .class-name"
          />
        </div>
      )}
      {data.action?.type === 'input' && (
        <div>
          <label className="text-sm font-medium">Input Value</label>
          <InputBuilder
            value={data.action?.value || ''}
            onChange={(value) => handleChange('action', { ...data.action, value })}
            availableContext={availableContext}
            placeholder="Text to input"
          />
        </div>
      )}
      {data.action?.type === 'openTab' && (
        <div>
          <label className="text-sm font-medium">URL</label>
          <InputBuilder
            value={data.action?.url || ''}
            onChange={(value) => handleChange('action', { ...data.action, url: value })}
            availableContext={availableContext}
            placeholder="https://example.com"
          />
        </div>
      )}
      <div>
        <label className="text-sm font-medium">Timeout (ms)</label>
        <input
          type="number"
          value={data.action?.timeout || 30000}
          onChange={(e) => handleChange('action', { ...data.action, timeout: parseInt(e.target.value) })}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          placeholder="30000"
        />
      </div>
    </div>
  )

  const renderNodeConfig = () => {
    switch (node.type) {
      case 'apiCall':
        return renderApiCallConfig(node.data as ApiCallNodeData)
      case 'codeTransform':
        return renderCodeTransformConfig(node.data as CodeTransformNodeData)
      case 'browserAction':
        return renderBrowserActionConfig(node.data as BrowserActionNodeData)
      default:
        return <div>No configuration available for this node type.</div>
    }
  }

  return (
    <Sheet open={!!node} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Configure {node.type} Node</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          {renderNodeConfig()}
        </div>
      </SheetContent>
    </Sheet>
  )
} 