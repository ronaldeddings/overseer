export interface Database {
  public: {
    Tables: {
      workflows: {
        Row: {
          id: string;
          name: string;
          definition: {
            nodes: any[];
            edges: any[];
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          definition: {
            nodes: any[];
            edges: any[];
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          definition?: {
            nodes: any[];
            edges: any[];
          };
          created_at?: string;
          updated_at?: string;
        };
      };
      execution_logs: {
        Row: {
          id: string;
          workflow_id: string;
          status: 'running' | 'completed' | 'failed';
          logs: {
            nodeResults: Record<string, any>;
            currentNode: string | null;
            error?: string;
          };
          created_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          status: 'running' | 'completed' | 'failed';
          logs: {
            nodeResults: Record<string, any>;
            currentNode: string | null;
            error?: string;
          };
          created_at?: string;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          status?: 'running' | 'completed' | 'failed';
          logs?: {
            nodeResults: Record<string, any>;
            currentNode: string | null;
            error?: string;
          };
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 