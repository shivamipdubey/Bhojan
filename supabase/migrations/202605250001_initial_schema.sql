-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================================
-- PROFILES TABLE: Complete user information
-- ============================================================================
create table public.profiles (
  -- Primary identification
  id uuid references auth.users on delete cascade primary key,
  
  -- Personal information (from signup step 2)
  full_name text not null,
  phone text not null,
  
  -- Delivery information (from signup step 3)
  address text not null,
  city text not null,
  postal_code text not null,
  
  -- Preferences (from signup step 3)
  dietary_preferences text[] not null default '{}',
  household_size integer not null default 1,
  
  -- Religious/Cultural preferences (set during onboarding, nullable initially)
  tradition text check (tradition in ('satvik', 'jain', 'halal', 'kosher', 'christian', 'vegetarian', 'vegan', 'none')),
  sub_tradition text,
  strictness text default 'standard' check (strictness in ('standard', 'strict', 'festival')),
  
  -- Additional dietary restrictions
  allergies text[] not null default '{}',
  dislikes text[] not null default '{}',
  
  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Optional: profile completion tracking
  onboarding_completed boolean not null default false,
  
  -- Optional: user preferences
  preferred_meal_times jsonb default '{"breakfast":"08:00","lunch":"13:00","dinner":"20:00"}',
  notification_preferences jsonb default '{"email":true,"sms":false,"push":true}'
);

-- Add helpful comment
comment on table public.profiles is 'Complete user profile including personal info, delivery details, and dietary preferences';

-- Add column comments for clarity
comment on column public.profiles.full_name is 'User full name from signup';
comment on column public.profiles.phone is 'Contact number for delivery coordination';
comment on column public.profiles.address is 'Primary delivery address';
comment on column public.profiles.dietary_preferences is 'Array of dietary tags: vegetarian, vegan, gluten-free, dairy-free, nut-allergy';
comment on column public.profiles.tradition is 'Religious/cultural food tradition, set during onboarding';
comment on column public.profiles.allergies is 'Specific allergens to avoid';
comment on column public.profiles.dislikes is 'Foods user dislikes';

-- ============================================================================
-- PROFILES RLS POLICIES
-- ============================================================================
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select 
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert 
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update 
  using (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete 
  using (auth.uid() = id);

-- ============================================================================
-- ADDRESSES TABLE: Multiple delivery addresses (optional enhancement)
-- ============================================================================
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  label text not null, -- 'Home', 'Office', 'Other'
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text,
  postal_code text not null,
  
  is_default boolean not null default false,
  
  delivery_instructions text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.addresses is 'Multiple delivery addresses per user';

alter table public.addresses enable row level security;

create policy "Users can manage own addresses"
  on public.addresses for all 
  using (auth.uid() = user_id);

-- ============================================================================
-- ORDERS TABLE: Order history
-- ============================================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Order details
  order_number text unique not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  
  -- Delivery information
  delivery_address_id uuid references public.addresses(id),
  delivery_time timestamptz,
  actual_delivery_time timestamptz,
  
  -- Pricing
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  
  -- Payment
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_method text,
  
  -- Notes
  special_instructions text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.orders is 'User order history and tracking';

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select 
  using (auth.uid() = user_id);

create policy "Users can create own orders"
  on public.orders for insert 
  with check (auth.uid() = user_id);

-- ============================================================================
-- ORDER ITEMS TABLE: Items in each order
-- ============================================================================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  
  -- Item details
  item_name text not null,
  item_description text,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  
  -- Customizations
  customizations jsonb default '{}',
  
  created_at timestamptz not null default now()
);

comment on table public.order_items is 'Individual items in each order';

alter table public.order_items enable row level security;

create policy "Users can view own order items"
  on public.order_items for select 
  using (
    exists (
      select 1 from public.orders 
      where orders.id = order_items.order_id 
      and orders.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SCANS TABLE: Food scanning history
-- ============================================================================
create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Scan context
  restaurant_name text,
  dish_name text,
  tradition text,
  
  -- Scan results
  scan_result jsonb not null,
  is_safe boolean,
  warnings text[],
  
  -- Location (optional)
  location_name text,
  
  created_at timestamptz not null default now()
);

comment on table public.scans is 'History of food scans and safety checks';

alter table public.scans enable row level security;

create policy "Users can view own scans"
  on public.scans for select 
  using (auth.uid() = user_id);

create policy "Users can create own scans"
  on public.scans for insert 
  with check (auth.uid() = user_id);

-- ============================================================================
-- OBSERVANCES TABLE: Religious/cultural observances
-- ============================================================================
create table public.observances (
  id uuid primary key default gen_random_uuid(),
  
  tradition text not null,
  name text not null,
  description text,
  
  start_date date not null,
  end_date date,
  
  dietary_rules jsonb not null default '{}',
  ritual_items text[] not null default '{}',
  
  is_recurring boolean not null default false,
  recurrence_rule text,
  
  created_at timestamptz not null default now()
);

comment on table public.observances is 'Religious and cultural observances with dietary rules';

alter table public.observances enable row level security;

create policy "Observances are public"
  on public.observances for select 
  using (true);

-- ============================================================================
-- MARKETPLACE ITEMS TABLE: Available products
-- ============================================================================
create table public.marketplace_items (
  id uuid primary key default gen_random_uuid(),
  
  name text not null,
  category text not null,
  traditions text[] not null default '{}',
  
  price numeric(10,2) not null,
  image_url text,
  description text,
  
  observance_tags text[] not null default '{}',
  
  in_stock boolean not null default true,
  stock_quantity integer,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.marketplace_items is 'Products available in marketplace';

alter table public.marketplace_items enable row level security;

create policy "Marketplace items are public"
  on public.marketplace_items for select 
  using (true);

-- ============================================================================
-- FAVORITES TABLE: User saved items
-- ============================================================================
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  item_type text not null check (item_type in ('dish', 'restaurant', 'marketplace_item')),
  item_id uuid not null,
  item_name text not null,
  
  created_at timestamptz not null default now(),
  
  unique(user_id, item_type, item_id)
);

comment on table public.favorites is 'User saved items and restaurants';

alter table public.favorites enable row level security;

create policy "Users can manage own favorites"
  on public.favorites for all 
  using (auth.uid() = user_id);

-- ============================================================================
-- INDEXES: For better query performance
-- ============================================================================
create index idx_profiles_tradition on public.profiles(tradition);
create index idx_orders_user_id on public.orders(user_id);
create index idx_orders_status on public.orders(status);
create index idx_order_items_order_id on public.order_items(order_id);
create index idx_scans_user_id on public.scans(user_id);
create index idx_addresses_user_id on public.addresses(user_id);
create index idx_favorites_user_id on public.favorites(user_id);

-- ============================================================================
-- FUNCTIONS: Automatic timestamp updates
-- ============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to relevant tables
create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.addresses
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.marketplace_items
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- SEED DATA: Sample observances and marketplace items
-- ============================================================================
insert into public.observances (tradition, name, description, start_date, end_date, dietary_rules, ritual_items, is_recurring, recurrence_rule)
values
  ('satvik', 'Ekadashi', 'Grains, beans, and lentils are restricted for many Vaishnava observers.', '2026-05-27', null, '{"changes":["Avoid grains","Avoid beans and lentils","Use sendha namak"]}', array['Sabudana','Sendha namak','Dry fruits','Kuttu ka atta'], true, 'twice lunar monthly'),
  ('jain', 'Paryushana', 'A period of stricter Jain observance with careful limits on vegetables and outside food.', '2026-08-18', '2026-08-26', '{"changes":["Avoid green leafy vegetables","Prefer home-prepared food"]}', array['Dry fruits','Stored grains','Jain-friendly snacks'], true, 'annual'),
  ('halal', 'Ramadan', 'Daily fasting from Fajr to Maghrib, with halal rules still applying during eating windows.', '2027-02-08', '2027-03-09', '{"changes":["Fast from dawn to sunset","Break fast with halal foods"]}', array['Dates','Rooh Afza','Halal soup mix'], true, 'annual'),
  ('kosher', 'Passover', 'Chametz is restricted, and many observers use separate certified Passover foods.', '2027-04-21', '2027-04-29', '{"changes":["Avoid chametz","Use kosher-for-Passover products"]}', array['Matzah','Kosher grape juice','Passover pantry kit'], true, 'annual'),
  ('christian', 'Good Friday', 'Many Catholic and Christian observers abstain from meat and eat simply.', '2027-03-26', null, '{"changes":["No meat","Simple meals"]}', array['Simple pantry kit','Fish-friendly meal kit'], true, 'annual');

insert into public.marketplace_items (name, category, traditions, price, description, observance_tags, in_stock, stock_quantity)
values
  ('Sabudana', 'Vrat Essentials', array['satvik'], 2.99, 'Tapioca pearls for Ekadashi-friendly khichdi and kheer.', array['Ekadashi'], true, 100),
  ('Sendha Namak', 'Vrat Essentials', array['satvik','jain'], 1.99, 'Rock salt used during many Hindu fasting days.', array['Ekadashi'], true, 150),
  ('Assorted Dry Fruits', 'Fasting Pantry', array['satvik','jain','halal','kosher'], 5.99, 'A compact energy kit for observance days.', array['Ekadashi','Paryushana','Ramadan'], true, 75),
  ('Kuttu Ka Atta', 'Vrat Essentials', array['satvik'], 2.49, 'Buckwheat flour for fasting rotis and pancakes.', array['Ekadashi'], true, 120),
  ('Premium Dates', 'Ramadan Pantry', array['halal'], 6.99, 'Soft dates for iftar and suhoor preparation.', array['Ramadan'], true, 200),
  ('Matzah Box', 'Passover Pantry', array['kosher'], 4.99, 'A starter matzah pack for Passover meals.', array['Passover'], true, 50);