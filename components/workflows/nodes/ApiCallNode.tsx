import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ApiCallNodeData {
  url: string;
  method: string;
  headers: Record<string, string>;
  onConfigure?: () => void;
  onChange?: (key: string, value: any) => void;
}

interface ApiCallNodeProps {
  data: ApiCallNodeData;
  isConnectable: boolean;
  selected?: boolean;
}

export default function ApiCallNode({ data, isConnectable, selected }: ApiCallNodeProps) {
  return (
    <Card className={`w-[300px] bg-white shadow-lg ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">API Call</CardTitle>
        <Button variant="ghost" size="icon" onClick={data.onConfigure}>
          <Settings2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <Label htmlFor="url" className="sr-only">URL</Label>
            <Input
              id="url"
              value={data.url}
              onChange={(e) => data.onChange?.('url', e.target.value)}
              placeholder="https://api.example.com"
              className="h-8"
            />
          </div>
          <div>
            <Label htmlFor="method" className="sr-only">Method</Label>
            <Select 
              value={data.method}
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
    </Card>
  );
} 