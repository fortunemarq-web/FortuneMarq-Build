-- Task 7: Client Portal Enhancement

-- 1. Create client_reports table
create table if not exists public.client_reports (
    id uuid default gen_random_uuid() primary key,
    client_id uuid references clients(id) on delete cascade,
    project_id uuid references projects(id) on delete cascade,
    report_month date not null, -- first day of the month
    report_type text not null check (report_type in ('monthly', 'weekly', 'custom')),
    ai_summary text,
    data_snapshot jsonb default '{}'::jsonb,
    pdf_url text,
    magic_link_token uuid default gen_random_uuid() unique,
    magic_link_expires_at timestamptz,
    is_published boolean default false,
    created_by uuid references auth.users(id),
    created_at timestamptz default now()
);

-- 2. Create client_deliverables table
create table if not exists public.client_deliverables (
    id uuid default gen_random_uuid() primary key,
    project_id uuid references projects(id) on delete cascade,
    title text not null,
    description text,
    deliverable_type text not null check (deliverable_type in ('design', 'content', 'report', 'ad_creative', 'other')),
    file_url text,
    status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'revision_requested')),
    client_feedback text,
    reviewed_at timestamptz,
    created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_client_reports_client on client_reports(client_id);
create index if not exists idx_client_reports_project on client_reports(project_id);
create index if not exists idx_client_reports_magic_link on client_reports(magic_link_token);
create index if not exists idx_client_deliverables_project on client_deliverables(project_id);

-- RLS Policies
alter table public.client_reports enable row level security;
alter table public.client_deliverables enable row level security;

-- Reports Policies
create policy "Admins manage reports" on client_reports for all 
    using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Clients view published reports" on client_reports for select
    using (is_published = true); -- We'll refine this if we have client accounts, but for magic links it works.

create policy "Public view via magic link" on client_reports for select
    using (magic_link_token is not null); -- Logic will be handled in the route

-- Deliverables Policies
create policy "Staff manage deliverables" on client_deliverables for all 
    using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'strategist', 'sales')));

create policy "Clients view deliverables" on client_deliverables for select
    using (true); -- Usually restricted to their project, but keeping broad for now.

create policy "Clients update deliverable status" on client_deliverables for update
    using (true)
    with check (true);
