-- Table: follow_ups
create table if not exists follow_ups (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references leads(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  follow_up_type text check (follow_up_type in ('call', 'whatsapp', 'email')),
  scheduled_at timestamptz not null,
  notes text,
  status text default 'pending' check (status in ('pending', 'completed', 'missed', 'rescheduled')),
  completed_at timestamptz,
  outcome_note text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- RLS Policies
alter table follow_ups enable row level security;

create policy "Users can view their own assigned follow ups or created follow ups"
  on follow_ups
  for select
  to authenticated
  using (
    assigned_to = auth.uid() 
    or created_by = auth.uid()
    or (select is_super_admin from admin_users where id = auth.uid()) = true
  );

create policy "Users can insert follow ups"
  on follow_ups
  for insert
  to authenticated
  with check (true);

create policy "Users can update their own follow ups"
  on follow_ups
  for update
  to authenticated
  using (
    assigned_to = auth.uid() 
    or created_by = auth.uid()
    or (select is_super_admin from admin_users where id = auth.uid()) = true
  );

create policy "Users can delete their own follow ups"
  on follow_ups
  for delete
  to authenticated
  using (
    assigned_to = auth.uid() 
    or created_by = auth.uid()
    or (select is_super_admin from admin_users where id = auth.uid()) = true
  );

-- Indexes for performance
create index follow_ups_lead_id_idx on follow_ups(lead_id);
create index follow_ups_assigned_to_idx on follow_ups(assigned_to);
create index follow_ups_status_idx on follow_ups(status);
create index follow_ups_scheduled_at_idx on follow_ups(scheduled_at);
