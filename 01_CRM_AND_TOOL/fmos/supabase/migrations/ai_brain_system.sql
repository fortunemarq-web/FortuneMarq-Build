-- Table: ai_usage_logs
create table if not exists ai_usage_logs (
  id uuid default gen_random_uuid() primary key,
  feature text not null, -- e.g., 'script_suggester', 'objection_handler', 'morning_brief', 'weekly_report'
  input_summary text,
  output_summary text,
  tokens_used integer default 0,
  model text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- RLS Policies
alter table ai_usage_logs enable row level security;

create policy "Users can view their own AI usage logs"
  on ai_usage_logs
  for select
  to authenticated
  using (
    created_by = auth.uid() 
    or (select is_super_admin from admin_users where id = auth.uid()) = true
  );

create policy "System can insert AI usage logs"
  on ai_usage_logs
  for insert
  to authenticated
  with check (true);

-- Indexes
create index ai_usage_logs_created_by_idx on ai_usage_logs(created_by);
create index ai_usage_logs_feature_idx on ai_usage_logs(feature);
create index ai_usage_logs_created_at_idx on ai_usage_logs(created_at);
