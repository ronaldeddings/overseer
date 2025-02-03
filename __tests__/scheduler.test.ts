import { WorkflowScheduler } from '@/lib/scheduler';
import { WorkflowEngine } from '@/lib/engine';
import { createClient } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

jest.mock('@/lib/engine', () => ({
  WorkflowEngine: jest.fn().mockImplementation(() => ({
    runWorkflow: jest.fn()
  }))
}));

describe('WorkflowScheduler', () => {
  let scheduler: WorkflowScheduler;
  let mockSupabase: any;
  let mockEngine: jest.Mocked<WorkflowEngine>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup Supabase mock
    mockSupabase = {
      from: jest.fn()
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    
    // Create new scheduler instance
    scheduler = new WorkflowScheduler();
    
    // Get mock engine instance
    mockEngine = new WorkflowEngine() as jest.Mocked<WorkflowEngine>;
  });

  afterEach(() => {
    // Stop all scheduled jobs
    scheduler.stopAll();
  });

  describe('initialize', () => {
    it('should fetch and schedule active workflows', async () => {
      // Mock workflow data
      const mockWorkflows = [
        { id: '1', name: 'Test 1', schedule: '* * * * *' },
        { id: '2', name: 'Test 2', schedule: '0 * * * *' }
      ];

      // Setup mock chain
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            data: mockWorkflows,
            error: null
          })
        })
      });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      // Setup spy before initialization
      const scheduleSpy = jest.spyOn(scheduler, 'scheduleWorkflow');

      // Initialize scheduler
      await scheduler.initialize();

      // Verify workflows were fetched
      expect(mockSupabase.from).toHaveBeenCalledWith('workflows');
      expect(mockSelect).toHaveBeenCalledWith('id, name, schedule');
      expect(mockSelect().eq).toHaveBeenCalledWith('is_active', true);

      // Verify jobs were scheduled
      expect(scheduleSpy).toHaveBeenCalledTimes(mockWorkflows.length);
      expect(scheduleSpy).toHaveBeenCalledWith('1', '* * * * *');
      expect(scheduleSpy).toHaveBeenCalledWith('2', '0 * * * *');
    });

    it('should handle errors when fetching workflows', async () => {
      // Mock error response
      const mockError = new Error('Database error');
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            data: null,
            error: mockError
          })
        })
      });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Initialize scheduler
      await scheduler.initialize();

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch scheduled workflows:', mockError);
    });
  });

  describe('scheduleWorkflow', () => {
    it('should create and store a cron job', () => {
      const workflowId = '1';
      const cronExpression = '* * * * *';

      // Schedule workflow
      scheduler.scheduleWorkflow(workflowId, cronExpression);

      // Verify job was stored
      const job = (scheduler as any).jobs.get(workflowId);
      expect(job).toBeDefined();
      expect(job.running).toBe(true);
    });

    it('should stop existing job before creating new one', () => {
      const workflowId = '1';
      const cronExpression = '* * * * *';

      // Create initial job
      scheduler.scheduleWorkflow(workflowId, cronExpression);
      const initialJob = (scheduler as any).jobs.get(workflowId);

      // Create new job with same ID
      scheduler.scheduleWorkflow(workflowId, '0 * * * *');
      const newJob = (scheduler as any).jobs.get(workflowId);

      // Verify jobs are different
      expect(newJob).not.toBe(initialJob);
      expect(initialJob.running).toBe(false);
      expect(newJob.running).toBe(true);
    });
  });

  describe('stopWorkflow', () => {
    it('should stop and remove a scheduled job', () => {
      const workflowId = '1';
      const cronExpression = '* * * * *';

      // Schedule and then stop workflow
      scheduler.scheduleWorkflow(workflowId, cronExpression);
      scheduler.stopWorkflow(workflowId);

      // Verify job was removed
      const job = (scheduler as any).jobs.get(workflowId);
      expect(job).toBeUndefined();
    });
  });

  describe('stopAll', () => {
    it('should stop all scheduled jobs', () => {
      // Schedule multiple workflows
      scheduler.scheduleWorkflow('1', '* * * * *');
      scheduler.scheduleWorkflow('2', '0 * * * *');

      // Stop all jobs
      scheduler.stopAll();

      // Verify all jobs were removed
      expect((scheduler as any).jobs.size).toBe(0);
    });
  });
}); 