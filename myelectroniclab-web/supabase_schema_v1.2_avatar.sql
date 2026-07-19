-- Version: 1.2
-- Title: Auth - avatar_icon column | Important Data: run AFTER
-- supabase_schema_v1.1_auth.sql. Adds the chosen profile icon (one of the 9
-- keys defined in lib/avatar-icons.ts) and updates handle_new_user() to store
-- it from signUp metadata. check constraint keeps the column in sync with that
-- fixed list - if you add a 10th icon in avatar-icons.ts, update the constraint
-- here too or new signups with that key will fail.

alter table public.profiles
  add column avatar_icon text not null default 'chip'
  constraint profiles_avatar_icon_check check (
    avatar_icon in (
      'chip', 'resistor', 'resistor-nodes', 'led-on', 'led-strip',
      'battery', 'antenna', 'robot', 'usb'
    )
  );

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, email, gender, role, college, mentor_approved, avatar_icon)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'gender', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student'),
    coalesce(new.raw_user_meta_data->>'college', ''),
    case when coalesce(new.raw_user_meta_data->>'role', 'student') = 'mentor' then false else true end,
    coalesce(new.raw_user_meta_data->>'avatar_icon', 'chip')
  );
  return new;
end;
$$ language plpgsql security definer;
