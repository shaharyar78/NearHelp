-- Enable Row Level Security on application tables.
alter table public.users enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.public_chat_messages enable row level security;
alter table public.community_places enable row level security;

-- Browser clients must access data through the server API.
revoke all on table public.users from anon, authenticated;
revoke all on table public.conversations from anon, authenticated;
revoke all on table public.messages from anon, authenticated;
revoke all on table public.public_chat_messages from anon, authenticated;
revoke all on table public.community_places from anon, authenticated;
