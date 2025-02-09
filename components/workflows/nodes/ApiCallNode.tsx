import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, Braces } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ContextPanel } from '../ContextPanel';
import { NodeOutput } from '@/lib/types/workflow';

export interface ApiCallNodeData {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  onConfigure?: () => void;
  onChange?: (key: string, value: any) => void;
  availableContext?: Record<string, NodeOutput>;
}

interface ApiCallNodeProps {
  data: ApiCallNodeData;
  isConnectable: boolean;
  selected?: boolean;
  id: string;
}

export default function ApiCallNode({ data, isConnectable, selected, id }: ApiCallNodeProps) {
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [activeField, setActiveField] = useState<'url' | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange?.(e.target.value, e.target.value);
  };

  const handleMethodChange = (value: string) => {
    data.onChange?.('method', value);
  };

  const handleContextSelect = (path: string) => {
    if (!activeField) return;
    
    // If cursor position is null or 0 and the field is empty, replace the entire value
    const shouldReplaceEntireValue = 
      (cursorPosition === null || cursorPosition === 0) && 
      (!data[activeField] || data[activeField].trim() === '');
    
    if (shouldReplaceEntireValue) {
      // For full replacements, don't wrap in template syntax
      data.onChange?.(activeField, `input['${path}']`);
    } else {
      // For partial replacements, use template syntax
      const template = `\${${path}.data}`;
      const currentValue = data[activeField] || '';
      const newValue = 
        currentValue.slice(0, cursorPosition || 0) + 
        template + 
        currentValue.slice(cursorPosition || 0);
      
      data.onChange?.(activeField, newValue);
    }
    
    setIsContextOpen(false);
  };

  // Extract numeric part of node ID for proper ordering
  const getNodeNumber = (nodeId: string) => {
    const match = nodeId.match(/\d+$/);
    return match ? parseInt(match[0]) : 0;
  };

  const currentNodeNumber = getNodeNumber(id);

  // Filter context to only show nodes that come before this one
  const filteredContext = data.availableContext ? 
    Object.fromEntries(
      Object.entries(data.availableContext)
        .filter(([nodeId]) => getNodeNumber(nodeId) < currentNodeNumber)
    ) : {};

  return (
    <Card className={`w-[300px] bg-white shadow-lg ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">API Call</CardTitle>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsContextOpen(true)}
            title="Insert context variable"
            disabled={Object.keys(filteredContext).length === 0}
          >
            <Braces className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => data.onConfigure?.()} 
            title="Configure"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <Label htmlFor="url" className="sr-only">URL</Label>
            <Input
              id="url"
              value={data.url || ''}
              onChange={(e) => data.onChange?.('url', e.target.value)}
              onClick={(e) => {
                setCursorPosition(e.currentTarget.selectionStart);
                setActiveField('url');
              }}
              onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart)}
              placeholder="https://api.example.com"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="method" className="sr-only">Method</Label>
            <Select 
              value={data.method || 'GET'}
              onValueChange={(value) => data.onChange?.('method', value)}
            >
              <SelectTrigger id="method" className="h-8">
                <SelectValue placeholder="GET" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />

      <ContextPanel
        outputs={filteredContext}
        onSelect={handleContextSelect}
        isOpen={isContextOpen}
        onOpenChange={setIsContextOpen}
      />
    </Card>
  );
} 