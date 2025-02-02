import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BrowserAction } from '@/lib/types/socket';

export interface BrowserActionNodeData {
  action: BrowserAction;
  onConfigure?: () => void;
  onChange?: (key: string, value: any) => void;
}

interface BrowserActionNodeProps {
  data: BrowserActionNodeData;
  isConnectable: boolean;
  selected?: boolean;
}

export default function BrowserActionNode({ data, isConnectable, selected }: BrowserActionNodeProps) {
  const handleActionTypeChange = (value: string) => {
    data.onChange?.('action', {
      ...data.action,
      type: value as BrowserAction['type']
    });
  };

  const handleSelectorChange = (value: string) => {
    data.onChange?.('action', {
      ...data.action,
      selector: value
    });
  };

  const handleValueChange = (value: string) => {
    data.onChange?.('action', {
      ...data.action,
      value
    });
  };

  const handleTimeoutChange = (value: string) => {
    data.onChange?.('action', {
      ...data.action,
      timeout: parseInt(value, 10)
    });
  };

  return (
    <Card className={`w-[300px] bg-white shadow-lg ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Browser Action</CardTitle>
        <Button variant="ghost" size="icon" onClick={data.onConfigure}>
          <Settings2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <Label htmlFor="action" className="sr-only">Action Type</Label>
            <Select
              value={data.action?.type || 'click'}
              onValueChange={handleActionTypeChange}
            >
              <SelectTrigger id="action" className="h-8">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="click">Click Element</SelectItem>
                <SelectItem value="input">Type Text</SelectItem>
                <SelectItem value="wait">Wait for Element</SelectItem>
                <SelectItem value="scrape">Scrape Content</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="selector" className="sr-only">CSS Selector</Label>
            <Input
              id="selector"
              value={data.action?.selector || ''}
              onChange={(e) => handleSelectorChange(e.target.value)}
              placeholder="#submit-button, .form-input"
              className="h-8"
            />
          </div>
          {data.action?.type === 'input' && (
            <div>
              <Label htmlFor="value" className="sr-only">Text to Type</Label>
              <Input
                id="value"
                value={data.action?.value || ''}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="Enter text..."
                className="h-8"
              />
            </div>
          )}
          <div>
            <Label htmlFor="timeout" className="sr-only">Timeout (ms)</Label>
            <Input
              id="timeout"
              type="number"
              value={data.action?.timeout || 30000}
              onChange={(e) => handleTimeoutChange(e.target.value)}
              placeholder="Timeout in milliseconds"
              className="h-8"
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