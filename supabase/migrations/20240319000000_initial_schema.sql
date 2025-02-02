-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create workflows table
create table if not exists workflows (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    definition jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    is_active boolean default true,
    schedule text -- Optional cron schedule
);

-- Create execution_logs table
create table if not exists execution_logs (
    id uuid primary key default uuid_generate_v4(),
    workflow_id uuid references workflows(id) on delete cascade,
    status text not null,
    started_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone,
    logs jsonb,
    error text
);

-- Add updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger update_workflows_updated_at
    before update on workflows
    for each row
    execute function update_updated_at_column();

-- Add indexes
create index if not exists idx_workflows_is_active on workflows(is_active);
create index if not exists idx_execution_logs_workflow_id on execution_logs(workflow_id);
create index if not exists idx_execution_logs_status on execution_logs(status); 