create table if not exists public.raids (
  id text primary key,
  title text not null,
  tweet_url text not null,
  tweet_id text not null,
  author text not null,
  note text not null default '',
  pool_milli integer not null check (pool_milli > 0),
  reward_milli integer not null check (reward_milli > 0),
  ends_at timestamptz not null,
  templates jsonb not null,
  sample boolean not null default false,
  created_by text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.claims (
  id text primary key,
  raid_id text not null references public.raids (id) on delete cascade,
  handle text not null,
  wallet text not null,
  template text not null,
  reply_url text not null,
  created_at timestamptz not null default now(),
  unique (raid_id, handle),
  unique (raid_id, wallet)
);

alter table public.raids enable row level security;
alter table public.claims enable row level security;
