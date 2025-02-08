## SpecStory

## Debugging Code Transform Workflow Issues (2/2/2025, 1:56:02 PM)

_**User**_

Please review @README.md in it's entirety to get a feel for the project...

Then investigate why when I click "Run Now" in my workflow I don't get the results from the code transform step....

{
    "status": "completed",
    "nodeResults": {
        "apiCall-1": {
            "fact": "In relation to their body size, cats have the largest eyes of any mammal.",
            "length": 73
        },
        "codeTransform-2": null,
        "apiCall-3": {
            "fact": "During the Middle Ages, cats were associated with withcraft, and on St. John’s Day, people all over Europe would stuff them into sacks and toss the cats into bonfires. On holy days, people celebrated by tossing cats from church towers.",
            "length": 235
        }
    }
}

---

_**Assistant**_

I'll help investigate why the code transform step isn't producing results. Let me first search for relevant code related to code transform execution.

---

_**Assistant**_



---

_**Assistant**_



Looking at the code, I can see that the issue is likely in the code transform executor implementation. Let me check the actual code in your workflow node to see what might be wrong.

---

_**Assistant**_



---

_**Assistant**_



Let me check the code transform executor implementation more closely, as I can see it's responsible for executing the code transformation step.

---

_**Assistant**_



---

_**Assistant**_



I can see the issue now. The code transform executor is expecting the code to set a `result` variable in the sandbox, but it looks like your code might not be doing that. The executor creates a sandbox with `input` containing the previous node results and a `result` variable that starts as null. Your code needs to explicitly set the `result` variable.

Looking at your workflow execution results:

```json
{
    "status": "completed",
    "nodeResults": {
        "apiCall-1": {
            "fact": "In relation to their body size, cats have the largest eyes of any mammal.",
            "length": 73
        },
        "codeTransform-2": null,
        "apiCall-3": {
            "fact": "During the Middle Ages, cats were associated with withcraft, and on St. John's Day, people all over Europe would stuff them into sacks and toss the cats into bonfires. On holy days, people celebrated by tossing cats from church towers.",
            "length": 235
        }
    }
}
```

The `codeTransform-2` result is null because the code in that node isn't setting the `result` variable. To fix this, you need to modify your code transform node's code to explicitly set the `result` variable.

For example, if you want to transform the fact from the first API call, your code should look something like this:

```javascript
result = {
  fact: input['apiCall-1'].fact,
  length: input['apiCall-1'].length,
  // add any transformations you want here
};
```

The key points to remember when writing code in a code transform node:

1. You have access to an `input` object that contains all previous node results
2. You must set the `result` variable to whatever you want the node to output
3. The `result` can be any valid JavaScript value (object, array, string, number, etc.)
4. You can access previous node results using their IDs (like `input['apiCall-1']`)

Would you like me to help you modify the code in your code transform node to properly set the result?

---

_**User**_

Can you fix my code so @CodeTransformNode.tsx @codeTransformExecutor.ts and @engine.ts work together correctly

---

_**Assistant**_

I'll help fix the code to make all components work together correctly. Let me make the necessary changes:

1. First, let's fix the CodeTransformNode interface to match what the executor expects:

---

_**Assistant**_

```
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
              placeholder={`// Access previous node results via 'input' object
// Set 'result' to your transformed data
// Example:
result = {
  fact: input['apiCall-1'].fact,
  transformed: true,
  timestamp: new Date().toISOString()
};`}
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
```

---

_**Assistant**_



2. Now, let's update the code transform executor to be more robust and provide better error handling:

---

_**Assistant**_

```
import { Node } from 'reactflow';
import type { NodeExecutor, WorkflowExecutionContext } from '../engine';

export interface CodeTransformNodeData {
  code: string;
  language: string;
}

export const codeTransformExecutor: NodeExecutor = {
  type: 'codeTransform',
  async execute(node: Node<CodeTransformNodeData>, context: WorkflowExecutionContext) {
    const { code } = node.data;

    if (!code) {
      throw new Error('Code is required for Code Transform node');
    }

    try {
      // Create a safe context with access to previous node results
      const sandbox = {
        input: context.nodeResults,
        result: null,
        console: {
          log: (...args: any[]) => console.log(`[CodeTransform ${node.id}]:`, ...args),
          error: (...args: any[]) => console.error(`[CodeTransform ${node.id}]:`, ...args)
        }
      };

      // Create a new Function with the sandbox as context
      const fn = new Function('input', 'console', `
        try {
          ${code}
          if (result === null || result === undefined) {
            throw new Error('Code must set the "result" variable');
          }
        } catch (error) {
          throw new Error('Code execution failed: ' + error.message);
        }
      `);

      // Execute the function with the sandbox
      fn.call(sandbox, sandbox.input, sandbox.console);

      return sandbox.result;
    } catch (error) {
      console.error(`Code transform error in node ${node.id}:`, error);
      throw new Error(`Code transform error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};
```

---

_**Assistant**_







3. Finally, let's fix the type errors in the engine:

---

_**Assistant**_

```
import { Node, Edge } from 'reactflow';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Types for workflow execution
export type WorkflowExecutionContext = {
  workflowId: string;
  nodes: Node[];
  edges: Edge[];
  nodeResults: Record<string, any>;
  currentNodeId: string | null;
  status: 'running' | 'completed' | 'failed';
  error?: Error;
};

export type NodeExecutor = {
  type: string;
  execute: (node: Node, context: WorkflowExecutionContext) => Promise<any>;
};

export class WorkflowEngine {
  private supabase;
  private nodeExecutors: Map<string, NodeExecutor>;

  constructor() {
    // Initialize Supabase client
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    this.nodeExecutors = new Map();
  }

  // Register a node executor for a specific node type
  registerNodeExecutor(executor: NodeExecutor) {
    this.nodeExecutors.set(executor.type, executor);
  }

  // Get the next nodes to execute based on current node and edges
  private getNextNodes(currentNodeId: string, nodes: Node[], edges: Edge[]): Node[] {
    const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
    return nodes.filter(node => outgoingEdges.some(edge => edge.target === node.id));
  }

  // Execute a single node
  private async executeNode(node: Node, context: WorkflowExecutionContext): Promise<any> {
    if (!node.type) {
      throw new Error(`Node ${node.id} has no type`);
    }

    const executor = this.nodeExecutors.get(node.type);
    if (!executor) {
      throw new Error(`No executor found for node type: ${node.type}`);
    }

    try {
      const result = await executor.execute(node, context);
      return result;
    } catch (error) {
      throw new Error(`Error executing node ${node.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Log execution progress
  private async logExecution(context: WorkflowExecutionContext) {
    try {
      await this.supabase.from('execution_logs').insert({
        workflow_id: context.workflowId,
        status: context.status,
        logs: {
          nodeResults: context.nodeResults,
          currentNode: context.currentNodeId,
          error: context.error?.message
        }
      });
    } catch (error) {
      console.error('Failed to log execution:', error);
    }
  }

  // Main workflow execution method
  async runWorkflow(workflowId: string): Promise<WorkflowExecutionContext> {
    // Fetch workflow from Supabase
    const { data: workflow, error } = await this.supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error || !workflow) {
      throw new Error(`Failed to fetch workflow: ${error?.message}`);
    }

    const context: WorkflowExecutionContext = {
      workflowId,
      nodes: workflow.definition.nodes,
      edges: workflow.definition.edges,
      nodeResults: {},
      currentNodeId: null,
      status: 'running'
    };

    try {
      // Find start nodes (nodes with no incoming edges)
      const startNodes = workflow.definition.nodes.filter((node: Node) => 
        !workflow.definition.edges.some((edge: Edge) => edge.target === node.id)
      );

      // Execute workflow starting from each start node
      for (const startNode of startNodes) {
        context.currentNodeId = startNode.id;
        await this.logExecution(context);

        let currentNodes = [startNode];
        while (currentNodes.length > 0) {
          const nextNodes: Node[] = [];
          
          // Execute current level nodes
          for (const node of currentNodes) {
            context.currentNodeId = node.id;
            const result = await this.executeNode(node, context);
            context.nodeResults[node.id] = result;
            
            // Get next nodes to execute
            const nodeNextNodes = this.getNextNodes(node.id, workflow.definition.nodes, workflow.definition.edges);
            nextNodes.push(...nodeNextNodes);
          }
          
          currentNodes = nextNodes;
        }
      }

      context.status = 'completed';
    } catch (error) {
      context.status = 'failed';
      context.error = error as Error;
      console.error('Workflow execution failed:', error);
    }

    // Log final execution state
    await this.logExecution(context);
    return context;
  }
}
```

---

_**Assistant**_



These changes accomplish several important things:

1. In the CodeTransformNode:
   - Added a more helpful placeholder text that shows users how to properly use the code transform node
   - Shows an example of how to access input and set the result

2. In the CodeTransformExecutor:
   - Added proper TypeScript types for the node data
   - Added a console object to the sandbox for debugging
   - Added validation to ensure the result is set
   - Improved error messages and logging
   - Made the execution context more secure

3. In the Engine:
   - Fixed type errors with proper type annotations
   - Added better error handling and logging
   - Added validation for node types
   - Improved error message formatting

Now when you use a code transform node, you should:

1. Access previous node results through the `input` object
2. Set your transformed data to the `result` variable
3. Use `console.log()` for debugging if needed

Example code to use in your code transform node:

```javascript
// Access the fact from the first API call
const fact = input['apiCall-1'].fact;

// Transform it somehow
const transformed = fact.toUpperCase();

// Set the result (this is required)
result = {
  originalFact: fact,
  transformedFact: transformed,
  length: transformed.length,
  timestamp: new Date().toISOString()
};

// Optionally log for debugging
console.log('Transformed fact:', transformed);
```

This should now work correctly and provide better feedback if something goes wrong. The code transform node will properly pass its results to the next node in the workflow.

---

_**User**_

The code transform is null.. here's what's in my code transform box

console.log("hi");
return 1+1;


----
response
---

{
    "status": "completed",
    "nodeResults": {
        "apiCall-1": {
            "fact": "In just 7 years, one un-spayed female cat and one un-neutered male cat and their offspring can result in 420,000 kittens.",
            "length": 121
        },
        "codeTransform-2": null,
        "apiCall-3": {
            "fact": "Since cats are so good at hiding illness, even a single instance of a symptom should be taken very seriously.",
            "length": 109
        }
    }
}

---

_**Assistant**_

Ah, I see the issue! In your code transform node, you're using `return` but that's not how the executor works. The executor expects you to set the `result` variable instead of using `return`. Here's how to fix your code:

Instead of:
```javascript
console.log("hi");
return 1+1;
```

You should write:
```javascript
console.log("hi");
result = 1+1;
```

The reason this happens is because the code transform executor creates a sandbox environment where your code runs, and it specifically looks for a `result` variable to be set. When you use `return`, it's returning from the inner function but not actually setting the `result` variable that the executor is looking for.

This is why in the placeholder example I showed:
```javascript
result = {
  fact: input['apiCall-1'].fact,
  transformed: true,
  timestamp: new Date().toISOString()
};
```

If you want to transform the cat fact from the first API call, you could do something like:

```javascript
console.log("Processing cat fact...");
result = {
  originalFact: input['apiCall-1'].fact,
  wordCount: input['apiCall-1'].fact.split(' ').length,
  calculation: 1 + 1
};
```

The key points to remember:
1. Always set the `result` variable
2. Don't use `return` statements
3. You can access previous node results through the `input` object
4. You can use `console.log()` for debugging

Try modifying your code transform to set the `result` variable instead of using `return`, and it should work!

---

_**User**_

It's still null....

{
    "status": "completed",
    "nodeResults": {
        "apiCall-1": {
            "fact": "A cat can travel at a top speed of approximately 31 mph (49 km) over a short distance.",
            "length": 86
        },
        "codeTransform-2": null,
        "apiCall-3": {
            "fact": "A cat can sprint at about thirty-one miles per hour.",
            "length": 52
        }
    }
}


Here's the code in the block

console.log("hi");
result = 1+1;

---

_**Assistant**_

Let me check if there might be a scope issue with how the result is being assigned. Let's modify the code transform executor to be more explicit about the scope and add more debugging.

---

_**Assistant**_

```
import { Node } from 'reactflow';
import type { NodeExecutor, WorkflowExecutionContext } from '../engine';

export interface CodeTransformNodeData {
  code: string;
  language: string;
}

export const codeTransformExecutor: NodeExecutor = {
  type: 'codeTransform',
  async execute(node: Node<CodeTransformNodeData>, context: WorkflowExecutionContext) {
    const { code } = node.data;

    if (!code) {
      throw new Error('Code is required for Code Transform node');
    }

    try {
      // Create a safe context with access to previous node results
      const sandbox = {
        input: context.nodeResults,
        result: null,
        console: {
          log: (...args: any[]) => console.log(`[CodeTransform ${node.id}]:`, ...args),
          error: (...args: any[]) => console.error(`[CodeTransform ${node.id}]:`, ...args)
        }
      };

      console.log(`[CodeTransform ${node.id}] Executing code:`, code);

      // Create a new Function with the sandbox as context
      const fn = new Function('sandbox', `
        with (sandbox) {
          try {
            ${code}
            console.log('[CodeTransform Debug] Result after execution:', result);
            if (result === null || result === undefined) {
              throw new Error('Code must set the "result" variable');
            }
          } catch (error) {
            console.error('[CodeTransform Debug] Execution error:', error);
            throw new Error('Code execution failed: ' + error.message);
          }
        }
      `);

      // Execute the function with the sandbox
      fn.call(sandbox, sandbox);

      console.log(`[CodeTransform ${node.id}] Execution result:`, sandbox.result);

      return sandbox.result;
    } catch (error) {
      console.error(`Code transform error in node ${node.id}:`, error);
      throw new Error(`Code transform error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};
```

---

_**Assistant**_



Now let's also update the code transform node to make the instructions even clearer:

---

_**Assistant**_

```
// ... existing code ...
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
// ... existing code ...
```

---

_**Assistant**_



I've made two major changes:

1. Updated the code transform executor to:
   - Use a `with` statement to ensure proper variable scope
   - Add more detailed debugging logs
   - Make the sandbox context more explicit

2. Updated the code transform node placeholder to:
   - Make it very clear that you must assign to `result`
   - Show simpler examples
   - Emphasize not to use `return` statements

Try your code transform again. You should see more detailed logs in the browser console that will help us understand what's happening. The logs should show:
- The code being executed
- The result after execution
- Any errors that occur

If it's still not working, please try this exact code in your code transform node:

```javascript
console.log('Input:', input);
result = 1 + 1;
console.log('Set result to:', result);
```

And let me know what you see in the browser's console logs (you can open it with F12 or right-click -> Inspect -> Console).

---

_**User**_

Alright, we got it .... Please update @README.md with ONLY the changes we worked on together in this thread

---

_**Assistant**_

I'll update the README.md to document the code transform fixes we worked on.

---

_**Assistant**_

```
// ... existing code ...

### Recent Updates

#### Code Transform Node Improvements
1. **Fixed Code Transform Execution**
   - Updated sandbox environment to properly handle result assignment
   - Added better error handling and debugging logs
   - Fixed scope issues with `with` statement in executor
   - Added clear instructions in the node placeholder

2. **Code Transform Usage**
   ```javascript
   // IMPORTANT: Must assign to 'result' variable
   // DO NOT use 'return' statements
   
   // Example 1 (Simple):
   result = 1 + 1;
   
   // Example 2 (Using input):
   result = {
     originalFact: input['apiCall-1'].fact,
     wordCount: input['apiCall-1'].fact.split(' ').length
   };
   ```

3. **Debugging Features**
   - Added detailed console logging in code transform executor
   - Each log is prefixed with node ID for clarity
   - Added result validation to ensure it's properly set
   - Improved error messages for common issues

// ... rest of existing code ...
```

---

_**Assistant**_



I've added a new section to the README that documents the improvements we made to the code transform functionality. This includes:

1. The technical fixes we implemented
2. Clear examples of how to use the code transform node correctly
3. The new debugging features we added

The documentation should help other users understand:
- Why they need to use `result =` instead of `return`
- How to access data from previous nodes
- What debugging tools are available
- Common issues to avoid

The changes are added as a "Recent Updates" section to keep the documentation current while preserving the rest of the README's structure.

---

_**User**_

There's an issue with workflow order...


In the output below apiCall-1 connects to apiCall-2 and codeTransform-3.... then apiCall-2 and codeTransform-3 connects to apiCall-4.... Look at the output closely because codeTransform-3 is not connected to apiCall-2 but still sees it as it's input....

{
    "status": "completed",
    "nodeResults": {
        "apiCall-1": {
            "fact": "Cats are now Britain's favourite pet: there are 7.7 million cats as opposed to 6.6 million dogs.",
            "length": 96
        },
        "apiCall-2": {
            "count": 1158,
            "name": "pal",
            "age": 64
        },
        "codeTransform-3": "{\"apiCall-1\":{\"fact\":\"Cats are now Britain's favourite pet: there are 7.7 million cats as opposed to 6.6 million dogs.\",\"length\":96},\"apiCall-2\":{\"count\":1158,\"name\":\"pal\",\"age\":64}}",
        "apiCall-4": {
            "count": 21,
            "name": "meelad",
            "age": 35
        }
    }
}


Here's code in codeTransform-3
result = JSON.stringify(input);


---

_**Assistant**_

I see the issue. The problem is in the workflow engine's execution order. Currently, it's executing nodes level by level (breadth-first), which means all nodes at the same "distance" from the start are executed in parallel, even if they're not directly connected.

Let's fix the engine to respect the exact graph connections:

---

_**Assistant**_

```
import { Node, Edge } from 'reactflow';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Types for workflow execution
export type WorkflowExecutionContext = {
  workflowId: string;
  nodes: Node[];
  edges: Edge[];
  nodeResults: Record<string, any>;
  currentNodeId: string | null;
  status: 'running' | 'completed' | 'failed';
  error?: Error;
};

export type NodeExecutor = {
  type: string;
  execute: (node: Node, context: WorkflowExecutionContext) => Promise<any>;
};

export class WorkflowEngine {
  private supabase;
  private nodeExecutors: Map<string, NodeExecutor>;

  constructor() {
    // Initialize Supabase client
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    this.nodeExecutors = new Map();
  }

  // Register a node executor for a specific node type
  registerNodeExecutor(executor: NodeExecutor) {
    this.nodeExecutors.set(executor.type, executor);
  }

  // Get all input nodes that connect to this node
  private getInputNodes(nodeId: string, nodes: Node[], edges: Edge[]): Node[] {
    const incomingEdges = edges.filter(edge => edge.target === nodeId);
    return nodes.filter(node => incomingEdges.some(edge => edge.source === node.id));
  }

  // Get all output nodes that this node connects to
  private getOutputNodes(nodeId: string, nodes: Node[], edges: Edge[]): Node[] {
    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    return nodes.filter(node => outgoingEdges.some(edge => edge.target === node.id));
  }

  // Get nodes that have no incoming edges
  private getStartNodes(nodes: Node[], edges: Edge[]): Node[] {
    return nodes.filter(node => !edges.some(edge => edge.target === node.id));
  }

  // Create a context specific to a node with only its input nodes' results
  private createNodeContext(node: Node, context: WorkflowExecutionContext): WorkflowExecutionContext {
    const inputNodes = this.getInputNodes(node.id, context.nodes, context.edges);
    const nodeResults: Record<string, any> = {};
    
    // Only include results from direct input nodes
    inputNodes.forEach(inputNode => {
      if (context.nodeResults[inputNode.id] !== undefined) {
        nodeResults[inputNode.id] = context.nodeResults[inputNode.id];
      }
    });

    return {
      ...context,
      nodeResults
    };
  }

  // Execute a single node
  private async executeNode(node: Node, context: WorkflowExecutionContext): Promise<any> {
    if (!node.type) {
      throw new Error(`Node ${node.id} has no type`);
    }

    const executor = this.nodeExecutors.get(node.type);
    if (!executor) {
      throw new Error(`No executor found for node type: ${node.type}`);
    }

    try {
      // Create a node-specific context with only its input nodes' results
      const nodeContext = this.createNodeContext(node, context);
      console.log(`Executing node ${node.id} with inputs:`, nodeContext.nodeResults);
      
      const result = await executor.execute(node, nodeContext);
      return result;
    } catch (error) {
      throw new Error(`Error executing node ${node.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Log execution progress
  private async logExecution(context: WorkflowExecutionContext) {
    try {
      await this.supabase.from('execution_logs').insert({
        workflow_id: context.workflowId,
        status: context.status,
        logs: {
          nodeResults: context.nodeResults,
          currentNode: context.currentNodeId,
          error: context.error?.message
        }
      });
    } catch (error) {
      console.error('Failed to log execution:', error);
    }
  }

  // Main workflow execution method
  async runWorkflow(workflowId: string): Promise<WorkflowExecutionContext> {
    // Fetch workflow from Supabase
    const { data: workflow, error } = await this.supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error || !workflow) {
      throw new Error(`Failed to fetch workflow: ${error?.message}`);
    }

    const context: WorkflowExecutionContext = {
      workflowId,
      nodes: workflow.definition.nodes,
      edges: workflow.definition.edges,
      nodeResults: {},
      currentNodeId: null,
      status: 'running'
    };

    try {
      // Track executed nodes to prevent cycles
      const executedNodes = new Set<string>();
      
      // Get start nodes (nodes with no incoming edges)
      const startNodes = this.getStartNodes(workflow.definition.nodes, workflow.definition.edges);
      
      // Function to execute a node and its descendants
      const executeNodeAndDescendants = async (node: Node) => {
        if (executedNodes.has(node.id)) {
          return; // Skip if already executed
        }
        
        // Get input nodes and ensure they're all executed
        const inputNodes = this.getInputNodes(node.id, context.nodes, context.edges);
        for (const inputNode of inputNodes) {
          if (!executedNodes.has(inputNode.id)) {
            await executeNodeAndDescendants(inputNode);
          }
        }
        
        // Execute current node
        context.currentNodeId = node.id;
        const result = await this.executeNode(node, context);
        context.nodeResults[node.id] = result;
        executedNodes.add(node.id);
        
        // Execute output nodes
        const outputNodes = this.getOutputNodes(node.id, context.nodes, context.edges);
        for (const outputNode of outputNodes) {
          await executeNodeAndDescendants(outputNode);
        }
      };
      
      // Execute workflow starting from each start node
      for (const startNode of startNodes) {
        await executeNodeAndDescendants(startNode);
      }

      context.status = 'completed';
    } catch (error) {
      context.status = 'failed';
      context.error = error as Error;
      console.error('Workflow execution failed:', error);
    }

    // Log final execution state
    await this.logExecution(context);
    return context;
  }
}
```

---

_**Assistant**_







The key changes I made to fix the workflow execution order:

1. Added new helper methods:
   - `getInputNodes`: Gets nodes that directly connect to a given node
   - `getOutputNodes`: Gets nodes that a given node directly connects to
   - `getStartNodes`: Gets nodes with no incoming connections
   - `createNodeContext`: Creates a context with ONLY the results from direct input nodes

2. Completely rewrote the execution logic to:
   - Use depth-first traversal instead of breadth-first
   - Respect exact graph connections
   - Only pass results from direct input nodes to each node
   - Track executed nodes to prevent cycles
   - Execute nodes in the correct dependency order

3. Added better logging to help debug execution flow

Now when a node executes:
1. It only sees results from nodes that directly connect to it
2. Nodes execute in the correct order based on their connections
3. The execution follows the exact graph structure you've defined

This should fix the issue where `codeTransform-3` was seeing results from `apiCall-2` even though they weren't connected. Each node will now only see results from its direct input nodes.

Let me know if you'd like me to update the README with these workflow execution improvements as well.

---



---

