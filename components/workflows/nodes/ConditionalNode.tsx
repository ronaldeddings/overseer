import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, Braces } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConditionalNodeData } from '@/lib/types/workflow';
import { ContextPanel } from '../ContextPanel';
import { useState } from 'react';

export const ConditionalNode: React.FC<NodeProps<ConditionalNodeData>> = ({
  data,
  isConnectable,
  selected,
  id,
}) => {
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  const handleConditionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange?.('condition', e.target.value);
  };

  const handleContextSelect = (path: string) => {
    if (cursorPosition === null) return;
    
    const template = `\${${path}.data}`;
    const newValue = 
      (data.condition || '').slice(0, cursorPosition) + 
      template + 
      (data.condition || '').slice(cursorPosition);
    
    data.onChange?.('condition', newValue);
    setIsContextOpen(false);
  };

  // Filter context to only show nodes that come before this one
  const filteredContext = data.availableContext ? 
    Object.fromEntries(
      Object.entries(data.availableContext)
        .filter(([nodeId]) => nodeId < id)
    ) : {};

  return (
    <Card className={`w-[300px] bg-white shadow-lg ${selected ? 'ring-2 ring-primary' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Conditional</CardTitle>
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
          <Label htmlFor="condition" className="sr-only">Condition</Label>
          <Input
            id="condition"
            value={data.condition || ''}
            onChange={handleConditionChange}
            onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
            onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart)}
            placeholder="input['node-1'].value > 0"
            className="h-8 text-sm"
          />
        </div>
      </CardContent>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '25%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '75%' }}
        isConnectable={isConnectable}
      />
      <div className="absolute bottom-[-20px] left-0 w-full flex justify-between px-[20%] text-xs">
        <span>True</span>
        <span>False</span>
      </div>

      <ContextPanel
        outputs={filteredContext}
        onSelect={handleContextSelect}
        isOpen={isContextOpen}
        onOpenChange={setIsContextOpen}
      />
    </Card>
  );
}; 