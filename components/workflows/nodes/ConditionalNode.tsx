import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConditionalNodeData } from '@/lib/types/workflow';

export const ConditionalNode: React.FC<NodeProps<ConditionalNodeData>> = ({
  data,
  isConnectable,
  selected,
}) => {
  const handleConditionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (data.onChange) {
      data.onChange(data.id!, {
        ...data,
        type: 'conditional',
        condition: e.target.value,
      });
    }
  };

  return (
    <Card className={`w-[300px] ${selected ? 'border-primary' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium">Conditional</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          <Label htmlFor="condition">Condition</Label>
          <Input
            id="condition"
            value={data.condition || ''}
            onChange={handleConditionChange}
            placeholder="Enter condition (e.g., input['codeTransform-1'].length > 1)"
            className="w-full"
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
    </Card>
  );
}; 