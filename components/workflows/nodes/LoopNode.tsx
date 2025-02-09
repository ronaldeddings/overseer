import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoopNodeData } from '@/lib/types/workflow';

export const LoopNode: React.FC<NodeProps<LoopNodeData>> = ({
  data,
  isConnectable,
  selected,
}) => {
  const handleLoopTypeChange = (value: string) => {
    data.onChange?.(data.id, { 
      ...data, 
      loopType: value as 'forEach' | 'while',
      // Clear irrelevant fields based on type
      ...(value === 'forEach' ? { condition: undefined } : { collection: undefined })
    });
  };

  const handleInputChange = (field: string, value: string) => {
    data.onChange?.(data.id, { ...data, [field]: value });
  };

  return (
    <Card className={`w-[300px] ${selected ? 'border-primary' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium">Loop</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div>
          <Label htmlFor="loopType">Loop Type</Label>
          <Select
            value={data.loopType}
            onValueChange={handleLoopTypeChange}
          >
            <SelectTrigger>
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
            <Label htmlFor="collection">Collection</Label>
            <Input
              id="collection"
              value={data.collection || ''}
              onChange={(e) => handleInputChange('collection', e.target.value)}
              placeholder="input.items"
              className="w-full"
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="condition">Condition</Label>
            <Input
              id="condition"
              value={data.condition || ''}
              onChange={(e) => handleInputChange('condition', e.target.value)}
              placeholder="input.counter < 10"
              className="w-full"
            />
          </div>
        )}

        <div>
          <Label htmlFor="maxIterations">Max Iterations</Label>
          <Input
            id="maxIterations"
            type="number"
            value={data.maxIterations || ''}
            onChange={(e) => handleInputChange('maxIterations', e.target.value)}
            placeholder="100"
            className="w-full"
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
    </Card>
  );
}; 