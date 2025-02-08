import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export interface SubWorkflowNodeData {
  workflowId: string;
  onConfigure?: () => void;
  onChange?: (key: string, value: any) => void;
}

interface SubWorkflowNodeProps {
  data: SubWorkflowNodeData;
  isConnectable: boolean;
  selected?: boolean;
}

interface WorkflowData {
  id: string;
  name: string;
}

export default function SubWorkflowNode({ data, isConnectable, selected }: SubWorkflowNodeProps) {
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkflows() {
      try {
        // Get current workflow ID from URL
        const currentWorkflowId = window.location.pathname.split('/').pop();
        
        // Get Supabase client
        const supabase = getSupabaseClient();
        
        // Fetch workflows with a simple query
        const { data: workflowData, error } = await supabase
          .from('workflows')
          .select('id, name')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter out the current workflow if it exists
        const filteredWorkflows = workflowData.filter(workflow => {
          if (!currentWorkflowId) return true;
          if (currentWorkflowId === 'new') return true;
          return workflow.id !== currentWorkflowId;
        });

        setWorkflows(filteredWorkflows);
      } catch (error) {
        console.error('Error fetching workflows:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflows();

    // Cleanup function
    return () => {
      setWorkflows([]);
      setLoading(true);
    };
  }, []);

  return (
    <Card className={`w-[300px] bg-white shadow-lg ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Sub-Workflow</CardTitle>
        <Button variant="ghost" size="icon" onClick={data.onConfigure}>
          <Settings2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <Label htmlFor="workflow" className="sr-only">Select Workflow</Label>
            <Select
              value={data.workflowId}
              onValueChange={(value) => data.onChange?.('workflowId', value)}
              disabled={loading}
            >
              <SelectTrigger id="workflow" className="h-8">
                <SelectValue placeholder="Select a workflow" />
              </SelectTrigger>
              <SelectContent>
                {workflows.map((workflow) => (
                  <SelectItem key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </SelectItem>
                ))}
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