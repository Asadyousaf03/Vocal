create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  source text not null check (source in ('web_call', 'outbound')),
  status text not null default 'new' check (status in ('new', 'callback_requested', 'ringing', 'calling', 'completed', 'failed')),
  lead_strength text not null default 'medium' check (lead_strength in ('weak', 'medium', 'strong')),
  comment text not null,
  follow_up_at timestamptz not null,
  call_duration_sec integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_follow_up_idx on public.leads(follow_up_at);
create index if not exists leads_strength_idx on public.leads(lead_strength);
create index if not exists lead_events_lead_id_idx on public.lead_events(lead_id);
create index if not exists lead_events_created_at_idx on public.lead_events(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.lead_events;
