import { CronJob } from 'cron';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { WorkflowEngine } from './engine';
import { ScheduledWorkflow } from './types/workflow';

export class WorkflowScheduler {
  private jobs: Map<string, CronJob>;
  private supabase;
  private engine: WorkflowEngine;

  constructor() {
    this.jobs = new Map();
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    this.engine = new WorkflowEngine();
  }

  async initialize() {
    try {
      // Fetch all active workflows with schedules
      const { data: workflows, error } = await this.supabase
        .from('workflows')
        .select('id, name, schedule')
        .eq('is_active', true)
        .not('schedule', 'is', null);

      if (error) {
        console.error('Failed to fetch scheduled workflows:', error);
        return;
      }

      // Schedule each workflow
      workflows?.forEach(workflow => {
        if (workflow.schedule) {
          this.scheduleWorkflow(workflow.id, workflow.schedule);
        }
      });

      console.log(`Initialized ${workflows?.length || 0} scheduled workflows`);
    } catch (error) {
      console.error('Failed to initialize scheduler:', error);
    }
  }

  scheduleWorkflow(workflowId: string, cronExpression: string) {
    try {
      // Stop existing job if any
      this.stopWorkflow(workflowId);

      // Create new cron job
      const job = new CronJob(
        cronExpression,
        async () => {
          try {
            console.log(`Executing scheduled workflow: ${workflowId}`);
            await this.engine.runWorkflow(workflowId);
          } catch (error) {
            console.error(`Failed to execute scheduled workflow ${workflowId}:`, error);
          }
        },
        null, // onComplete
        true, // start
        'UTC' // timeZone
      );

      // Store the job
      this.jobs.set(workflowId, job);
      console.log(`Scheduled workflow ${workflowId} with cron: ${cronExpression}`);
    } catch (error) {
      console.error(`Failed to schedule workflow ${workflowId}:`, error);
    }
  }

  stopWorkflow(workflowId: string) {
    const job = this.jobs.get(workflowId);
    if (job) {
      job.stop();
      this.jobs.delete(workflowId);
      console.log(`Stopped scheduled workflow: ${workflowId}`);
    }
  }

  stopAll() {
    this.jobs.forEach((job, workflowId) => {
      job.stop();
      console.log(`Stopped scheduled workflow: ${workflowId}`);
    });
    this.jobs.clear();
  }
}

// Export singleton instance
export const scheduler = new WorkflowScheduler();

export async function loadScheduledWorkflows(): Promise<ScheduledWorkflow[]> {
  // TODO: Load scheduled workflows from database
  return [];
}

export function initializeScheduler(workflows: ScheduledWorkflow[]): void {
  // TODO: Initialize scheduler with workflows
  console.log('Initializing scheduler with workflows:', workflows);
} 