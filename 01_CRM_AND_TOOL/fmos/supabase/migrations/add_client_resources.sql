
-- Create a table for client resources (Google Drive links, etc.)
create table if not exists client_resources (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  resource_type text check (resource_type in ('drive_folder', 'file', 'link', 'other')),
  title text not null,
  url text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table client_resources enable row level security;

-- Policies
create policy "Users can view client resources" on client_resources for select using (true);
create policy "Users can insert client resources" on client_resources for insert with check (true);
create policy "Users can update client resources" on client_resources for update using (true);
create policy "Users can delete client resources" on client_resources for delete using (true);
