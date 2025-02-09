import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { NodeOutput } from '@/lib/types/workflow';

interface ContextPanelProps {
  outputs: Record<string, NodeOutput>;
  onSelect?: (path: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TreeNodeProps {
  label: string;
  value: any;
  path: string;
  onSelect?: (path: string) => void;
  depth?: number;
}

function TreeNode({ label, value, path, onSelect, depth = 0 }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isObject = value !== null && typeof value === 'object';
  const hasChildren = isObject && Object.keys(value).length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    if (!isObject && onSelect) {
      onSelect(path);
    }
  };

  const renderValue = () => {
    if (value === null) return <span className="text-muted-foreground">null</span>;
    if (value === undefined) return <span className="text-muted-foreground">undefined</span>;
    if (typeof value === 'string') return <span className="text-green-500">"{value}"</span>;
    if (typeof value === 'number') return <span className="text-blue-500">{value}</span>;
    if (typeof value === 'boolean') return <span className="text-purple-500">{value.toString()}</span>;
    if (Array.isArray(value)) return <span className="text-muted-foreground">Array[{value.length}]</span>;
    if (isObject) return <span className="text-muted-foreground">Object</span>;
    return String(value);
  };

  return (
    <div className="select-none" style={{ marginLeft: depth * 16 }}>
      <div 
        className={`flex items-center py-1 hover:bg-accent/50 rounded ${!isObject ? 'cursor-pointer' : ''}`}
        onClick={handleSelect}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0"
            onClick={handleToggle}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        {!hasChildren && <div className="w-4" />}
        <span className="font-medium mr-2">{label}:</span>
        {renderValue()}
        {!isObject && (
          <Badge 
            variant="outline" 
            className="ml-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(path);
            }}
          >
            Use
          </Badge>
        )}
      </div>
      
      {isExpanded && hasChildren && (
        <div className="ml-2">
          {Array.isArray(value) ? (
            value.map((item, index) => (
              <TreeNode
                key={index}
                label={`[${index}]`}
                value={item}
                path={`${path}[${index}]`}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))
          ) : (
            Object.entries(value).map(([key, val]) => (
              <TreeNode
                key={key}
                label={key}
                value={val}
                path={`${path}.${key}`}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function ContextPanel({ outputs, onSelect, isOpen, onOpenChange }: ContextPanelProps) {
  const [search, setSearch] = useState('');

  const filteredOutputs = Object.entries(outputs).filter(([nodeId, output]) => {
    const searchLower = search.toLowerCase();
    return (
      nodeId.toLowerCase().includes(searchLower) ||
      JSON.stringify(output.data).toLowerCase().includes(searchLower)
    );
  });

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Available Context</SheetTitle>
        </SheetHeader>
        
        <div className="py-4">
          <Input
            placeholder="Search context..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />
          
          <ScrollArea className="h-[calc(100vh-200px)]">
            {filteredOutputs.map(([nodeId, output]) => (
              <div key={nodeId} className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{nodeId}</h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(output.timestamp).toLocaleString()}
                  </span>
                </div>
                <TreeNode
                  label="data"
                  value={output.data}
                  path={nodeId}
                  onSelect={onSelect}
                />
              </div>
            ))}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
} 