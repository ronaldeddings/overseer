import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, Braces } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoopNodeData } from '@/lib/types/workflow';
import { ContextPanel } from '../ContextPanel';
import { useState } from 'react';

export const LoopNode: React.FC<NodeProps<LoopNodeData>> = ({
  data,
  isConnectable,
  selected,
  id,
}) => {
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [activeField, setActiveField] = useState<'condition' | 'collection' | null>(null);

  const handleLoopTypeChange = (value: string) => {
    data.onChange?.('loopType', value);
    // Clear irrelevant fields based on type
    if (value === 'forEach') {
      data.onChange?.('condition', undefined);
    } else {
      data.onChange?.('collection', undefined);
    }
  };

  const handleContextSelect = (path: string) => {
    if (cursorPosition === null || !activeField) return;
    
    // Format the path to access the data property
    const template = `\${${path}.data}`;
    const currentValue = data[activeField] || '';
    const newValue = 
      currentValue.slice(0, cursorPosition) + 
      template + 
      currentValue.slice(cursorPosition);
    
    data.onChange?.(activeField, newValue);
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
        <CardTitle className="text-sm font-medium">Loop</CardTitle>
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
      <CardContent className="space-y-2">
        <div>
          <Label htmlFor="loopType" className="sr-only">Loop Type</Label>
          <Select
            value={data.loopType || 'forEach'}
            onValueChange={handleLoopTypeChange}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select loop type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="forEach">For Each</SelectItem>
              <SelectItem value="while">While</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.loopType === 'forEach' ? (
          <div>
            <Label htmlFor="collection" className="sr-only">Collection</Label>
            <Input
              id="collection"
              value={data.collection || ''}
              onChange={(e) => data.onChange?.('collection', e.target.value)}
              onClick={(e) => {
                setCursorPosition(e.currentTarget.selectionStart);
                setActiveField('collection');
              }}
              onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart)}
              placeholder="input['node-1'].items"
              className="h-8 text-sm"
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="condition" className="sr-only">Condition</Label>
            <Input
              id="condition"
              value={data.condition || ''}
              onChange={(e) => data.onChange?.('condition', e.target.value)}
              onClick={(e) => {
                setCursorPosition(e.currentTarget.selectionStart);
                setActiveField('condition');
              }}
              onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart)}
              placeholder="input['node-1'].counter < 10"
              className="h-8 text-sm"
            />
          </div>
        )}

        <div>
          <Label htmlFor="maxIterations" className="sr-only">Max Iterations</Label>
          <Input
            id="maxIterations"
            type="number"
            value={data.maxIterations || ''}
            onChange={(e) => data.onChange?.('maxIterations', parseInt(e.target.value))}
            placeholder="Max iterations (default: 100)"
            className="h-8 text-sm"
          />
        </div>
      </CardContent>
      <Handle
        type="source"
        position={Position.Bottom}
        id="body"
        style={{ left: '25%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="next"
        style={{ left: '75%' }}
        isConnectable={isConnectable}
      />
      <div className="absolute bottom-[-20px] left-0 w-full flex justify-between px-[20%] text-xs">
        <span>Body</span>
        <span>Next</span>
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