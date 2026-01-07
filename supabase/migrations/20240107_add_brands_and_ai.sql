-- Create brands table
create table brands (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for brands
alter table brands enable row level security;

create policy "Brands are viewable by everyone." on brands
  for select using (true);

create policy "Authenticated users can insert brands." on brands
  for insert with check (auth.role() = 'authenticated');

-- Add brand column to clothing table
alter table clothing add column brand text;

-- Add index for faster search
create index idx_brands_name on brands(name);
