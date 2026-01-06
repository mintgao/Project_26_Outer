-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  body_measurements jsonb default '{}'::jsonb,
  body_type_preset text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create clothing table
create table clothing (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  image_url text not null,
  category text not null,
  color text not null,
  season text not null,
  mark_coordinates jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table clothing enable row level security;

create policy "Individuals can view their own clothing items." on clothing
  for select using (auth.uid() = user_id);

create policy "Individuals can insert their own clothing items." on clothing
  for insert with check (auth.uid() = user_id);

create policy "Individuals can update their own clothing items." on clothing
  for update using (auth.uid() = user_id);

create policy "Individuals can delete their own clothing items." on clothing
  for delete using (auth.uid() = user_id);

-- Create outfits table
create table outfits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  occasion text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table outfits enable row level security;

create policy "Individuals can view their own outfits." on outfits
  for select using (auth.uid() = user_id);

create policy "Individuals can insert their own outfits." on outfits
  for insert with check (auth.uid() = user_id);

create policy "Individuals can update their own outfits." on outfits
  for update using (auth.uid() = user_id);

create policy "Individuals can delete their own outfits." on outfits
  for delete using (auth.uid() = user_id);

-- Create outfit_items table
create table outfit_items (
  id uuid default gen_random_uuid() primary key,
  outfit_id uuid references outfits(id) on delete cascade not null,
  clothing_id uuid references clothing(id) on delete cascade not null
);

alter table outfit_items enable row level security;

create policy "Individuals can view their own outfit items." on outfit_items
  for select using (
    exists ( select 1 from outfits where id = outfit_items.outfit_id and user_id = auth.uid() )
  );

create policy "Individuals can insert their own outfit items." on outfit_items
  for insert with check (
    exists ( select 1 from outfits where id = outfit_items.outfit_id and user_id = auth.uid() )
  );

-- Create a bucket for clothing images
insert into storage.buckets (id, name, public) values ('clothing-images', 'clothing-images', true);

create policy "Clothing images are publicly accessible." on storage.objects
  for select using ( bucket_id = 'clothing-images' );

create policy "Anyone can upload clothing images." on storage.objects
  for insert with check ( bucket_id = 'clothing-images' );

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
