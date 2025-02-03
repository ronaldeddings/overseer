import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CodeTransformNodeData {
  code: string;
  language: string;
  onConfigure?: () => void;
  onChange?: (key: string, value: any) => void;
}

interface CodeTransformNodeProps {
  data: CodeTransformNodeData;
  isConnectable: boolean;
  selected?: boolean;
}

export default function CodeTransformNode({ data, isConnectable, selected }: CodeTransformNodeProps) {
  return (
    <Card className={`w-[400px] bg-white shadow-lg ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Code Transform</CardTitle>
        <Button variant="ghost" size="icon" onClick={data.onConfigure}>
          <Settings2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <Label htmlFor="code" className="sr-only">Code</Label>
            <Textarea
              id="code"
              value={data.code}
              onChange={(e) => data.onChange?.('code', e.target.value)}
              placeholder={`// IMPORTANT: You must assign to the 'result' variable
// DO NOT use 'return' statements

// Example 1 (Simple):
result = 1 + 1;

// Example 2 (Using input):
result = {
  originalFact: input['apiCall-1'].fact,
  wordCount: input['apiCall-1'].fact.split(' ').length
};

// You can use console.log for debugging:
console.log('Debug:', input);`}
              className="h-[120px] font-mono resize-none"
            />
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
    </Card>
  );
} 