-- 保養品存貨清單 — Supabase schema
-- 在 Supabase Dashboard 的 SQL Editor 貼上整份執行一次即可。

create table if not exists lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_email text not null,
  created_at timestamptz not null default now()
);

create table if not exists list_members (
  list_id uuid not null references lists (id) on delete cascade,
  email text not null,
  added_at timestamptz not null default now(),
  primary key (list_id, email)
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists (id) on delete cascade,
  name text not null,
  category text not null,
  expiry_date date,
  quantity integer not null default 1,
  note text not null default '',
  status text not null default 'active' check (status in ('active', 'used')),
  added_by_email text not null,
  added_by_name text not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

-- 建立清單時，自動把擁有者加進 list_members，避免「先有雞先有蛋」的權限問題。
create or replace function handle_new_list()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into list_members (list_id, email) values (new.id, new.owner_email);
  return new;
end;
$$;

drop trigger if exists on_list_created on lists;
create trigger on_list_created
  after insert on lists
  for each row execute function handle_new_list();

-- 權限判斷用的 helper function（security definer 避免 RLS 遞迴問題）
create or replace function is_list_member(target_list_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from list_members
    where list_id = target_list_id
      and email = auth.jwt() ->> 'email'
  );
$$;

create or replace function is_list_owner(target_list_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from lists
    where id = target_list_id
      and owner_email = auth.jwt() ->> 'email'
  );
$$;

alter table lists enable row level security;
alter table list_members enable row level security;
alter table items enable row level security;

drop policy if exists "members can select lists" on lists;
create policy "members can select lists" on lists
  for select using (is_list_member(id));

drop policy if exists "owner can insert lists" on lists;
create policy "owner can insert lists" on lists
  for insert with check (owner_email = auth.jwt() ->> 'email');

drop policy if exists "members can update lists" on lists;
create policy "members can update lists" on lists
  for update using (is_list_member(id));

drop policy if exists "owner can delete lists" on lists;
create policy "owner can delete lists" on lists
  for delete using (owner_email = auth.jwt() ->> 'email');

drop policy if exists "members can view membership" on list_members;
create policy "members can view membership" on list_members
  for select using (is_list_member(list_id));

drop policy if exists "owner or member can invite" on list_members;
create policy "owner or member can invite" on list_members
  for insert with check (is_list_owner(list_id) or is_list_member(list_id));

drop policy if exists "owner or self can remove membership" on list_members;
create policy "owner or self can remove membership" on list_members
  for delete using (is_list_owner(list_id) or email = auth.jwt() ->> 'email');

drop policy if exists "members can select items" on items;
create policy "members can select items" on items
  for select using (is_list_member(list_id));

drop policy if exists "members can insert items" on items;
create policy "members can insert items" on items
  for insert with check (is_list_member(list_id));

drop policy if exists "members can update items" on items;
create policy "members can update items" on items
  for update using (is_list_member(list_id));

drop policy if exists "members can delete items" on items;
create policy "members can delete items" on items
  for delete using (is_list_member(list_id));

-- 讓 Realtime 廣播 items 的異動，App 才能即時同步給其他家人
-- 用 DO block 包起來是因為部分 Supabase 專案預設就把所有 table 都加進這個 publication 了，
-- 直接執行 ALTER PUBLICATION ... ADD TABLE 在那種情況下會報錯（table 已存在於 publication），
-- 而 Supabase SQL Editor 是把整份腳本當一個交易執行，只要有一行報錯，前面全部建立的
-- table / policy 都會被回滾，導致整份 schema 形同沒跑過。
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'items'
  ) then
    alter publication supabase_realtime add table items;
  end if;
end $$;
