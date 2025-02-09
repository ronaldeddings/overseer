import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Settings2, Braces } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContextPanel } from '../ContextPanel';
import { useState } from 'react';
import { NodeOutput } from '@/lib/types/workflow';

export interface CodeTransformNodeData {
  code: string;
  language: string;
  onConfigure?: () => void;
  onChange?: (key: string, value: any) => void;
  availableContext?: Record<string, NodeOutput>;
}

export default function CodeTransformNode({ data, isConnectable, selected, id }: NodeProps<CodeTransformNodeData>) {
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    data.onChange?.('code', e.target.value);
  };

  const handleContextSelect = (path: string) => {
    if (cursorPosition === null) return;
    
    const template = `\${${path}.data}`;
    const newValue = 
      (data.code || '').slice(0, cursorPosition) + 
      template + 
      (data.code || '').slice(cursorPosition);
    
    data.onChange?.('code', newValue);
    setIsContextOpen(false);
  };

  // Filter context to only show nodes that come before this one
  const filteredContext = data.availableContext ? 
    Object.fromEntries(
      Object.entries(data.availableContext)
        .filter(([nodeId]) => nodeId < id)
    ) : {};

  return (
    <Card className={`w-[400px] bg-white shadow-lg ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Code Transform</CardTitle>
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
            <Label htmlFor="code" className="sr-only">Code</Label>
            <Textarea
              id="code"
              value={data.code || ''}
              onChange={handleCodeChange}
              onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
              onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart)}
              placeholder={`// IMPORTANT: You must assign to the 'result' variable
// DO NOT use 'return' statements or template strings (\${...})
// Access previous node data through the 'input' object

// Example 1 (Simple):
result = 1 + 1;

// Example 2 (Using input):
result = input['apiCall-1'].fact;

// Example 3 (Accessing nested data):
result = {
  fact: input['apiCall-1'].fact,
  length: input['apiCall-1'].length
};

// You can use console.log for debugging:
console.log('Debug:', input);`}
              className="h-[120px] font-mono text-sm resize-none"
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

      <ContextPanel
        outputs={filteredContext}
        onSelect={handleContextSelect}
        isOpen={isContextOpen}
        onOpenChange={setIsContextOpen}
      />
    </Card>
  );
} 