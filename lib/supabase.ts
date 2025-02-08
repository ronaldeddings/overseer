import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

let supabaseInstance: SupabaseClient<Database> | null = null;

// Get or create the Supabase client instance
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
}

// Workflow types
export interface Workflow {
  id: string
  name: string
  description?: string
  definition: {
    nodes: any[]
    edges: any[]
  }
  created_at?: string
  updated_at?: string
  is_active?: boolean
  schedule?: string
}

// Load workflow
export async function loadWorkflow(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Save new workflow
export async function saveWorkflow(workflow: Partial<Workflow>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('workflows')
    .insert(workflow)
    .select()
    .single()

  if (error) throw error
  return data
}

// Update existing workflow
export async function updateWorkflow(id: string, workflow: Partial<Workflow>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('workflows')
    .update(workflow)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get all workflows
export async function getAllWorkflows() {
  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('id, name')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in getAllWorkflows:', error);
    throw error;
  }
}

export async function deleteWorkflow(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
} 