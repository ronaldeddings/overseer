import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Workflow = {
  id: string
  name: string
  definition: {
    nodes: any[]
    edges: any[]
  }
  created_at?: string
  updated_at?: string
}

export async function saveWorkflow(workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('workflows')
    .insert(workflow)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateWorkflow(id: string, workflow: Partial<Omit<Workflow, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('workflows')
    .update(workflow)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function loadWorkflow(id: string) {
  const { data, error } = await supabase
    .from('workflows')
    .select()
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Workflow
}

export async function deleteWorkflow(id: string) {
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
} 