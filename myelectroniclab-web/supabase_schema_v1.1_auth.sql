-- Version: 1.1
-- Title: Auth - profiles table | Important Data: adds public.profiles on top of
-- Supabase's built-in auth.users. Run this once in Supabase → SQL Editor. Depends
-- on nothing in supabase_schema_v1.0.sql (products/tickets/etc.) - purely additive.
-- Self-managed email/password auth only, no Google SSO, so every field below is
-- always populated at signUp time via the trigger below.

create type user_role as enum ('student', 'mentor');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text not null,
  gender text not null,
  role user_role not null,
  college text not null,
  mentor_approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- כשמשתמש חדש נרשם ב-auth.users (דרך app/register), יוצרים לו שורת profile
-- אוטומטית מתוך ה-metadata שנשלח ב-signUp({ options: { data: {...} } })
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, email, gender, role, college, mentor_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'gender', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student'),
    coalesce(new.raw_user_meta_data->>'college', ''),
    -- סטודנט מאושר אוטומטית; מנחה ממתין לאישור אדמין (ראה תוכנית פאזה 5)
    case when coalesce(new.raw_user_meta_data->>'role', 'student') = 'mentor' then false else true end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

-- כל משתמש רואה/עורך רק את עצמו. לאדמין (SUPABASE_SECRET_KEY, service_role)
-- יש גישה מלאה כברירת מחדל - RLS לא חל על service_role.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
