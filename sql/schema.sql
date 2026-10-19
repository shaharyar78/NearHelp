-- UUID generate karne ke liye
create extension if not exists pgcrypto;

-- User accounts
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  email text not null unique,
  password_hash text not null,
  role text not null default 'user'
    check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional private conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_one uuid not null references public.users(id) on delete cascade,
  user_two uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_one <> user_two)
);

-- Conversation messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.conversations(id) on delete cascade,
  sender_id uuid not null
    references public.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists conversations_user_one_idx
  on public.conversations(user_one);

create index if not exists conversations_user_two_idx
  on public.conversations(user_two);

create index if not exists messages_conversation_created_idx
  on public.messages(conversation_id, created_at);

alter table public.users
  add column if not exists gender text,
  add column if not exists location text,
  add column if not exists work text;

create table if not exists public.public_chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists public_chat_messages_created_at_idx
  on public.public_chat_messages(created_at);

-- Community-submitted places require admin review before publication.
create table if not exists public.community_places (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  category text not null,
  address text not null default '' check (char_length(address) <= 200),
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  submitted_by uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists community_places_status_created_idx
  on public.community_places(status, created_at);

alter table public.users enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.public_chat_messages enable row level security;
alter table public.community_places enable row level security;

revoke all on table public.users from anon, authenticated;
revoke all on table public.conversations from anon, authenticated;
revoke all on table public.messages from anon, authenticated;
revoke all on table public.public_chat_messages from anon, authenticated;
revoke all on table public.community_places from anon, authenticated;
