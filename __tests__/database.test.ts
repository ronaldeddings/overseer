import { supabase } from '../lib/supabase'

describe('Database Setup', () => {
  describe('Supabase Connection', () => {
    it('should have valid Supabase configuration', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
    })

    it('should have a valid Supabase client', () => {
      expect(supabase).toBeDefined()
      expect(supabase.from).toBeDefined()
    })
  })

  describe('Workflows Table', () => {
    it('should have workflows table with correct schema', async () => {
      const { data: columns, error } = await supabase
        .from('workflows')
        .select('id, name, definition')
        .limit(1)
      
      expect(error).toBeNull()
      expect(columns).toBeDefined()
    })
  })

  describe('Execution Logs Table', () => {
    it('should have execution_logs table with correct schema', async () => {
      const { data: columns, error } = await supabase
        .from('execution_logs')
        .select('id, workflow_id, logs, status')
        .limit(1)
      
      expect(error).toBeNull()
      expect(columns).toBeDefined()
    })
  })

  describe('Database Functions', () => {
    it('should support JSON operations for workflow definitions', async () => {
      const testWorkflow = {
        name: 'Test Workflow',
        definition: {
          nodes: [],
          edges: []
        }
      }

      const { data, error } = await supabase
        .from('workflows')
        .insert(testWorkflow)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.definition).toEqual(testWorkflow.definition)

      // Cleanup
      if (data?.id) {
        await supabase
          .from('workflows')
          .delete()
          .eq('id', data.id)
      }
    })
  })
}) 