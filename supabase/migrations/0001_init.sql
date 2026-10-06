-- Philippines Store Review Daily Dashboard — initial schema (Phase 2)
-- All "date" columns are Asia/Manila local dates.

create table stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  brand text not null check (brand in ('WOLHWA_GALBI', 'KODOKODO')),
  store_name text not null,
  short_name text not null,
  google_account_id text,
  google_location_id text unique,
  address text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table topics (
  key text primary key,
  label text not null,
  sort_order int not null default 0
);

insert into topics (key, label, sort_order) values
  ('food_quality', 'Food Quality', 1),
  ('flavor', 'Flavor', 2),
  ('meat_quality', 'Meat Quality', 3),
  ('service', 'Service', 4),
  ('staff', 'Staff', 5),
  ('waiting_time', 'Waiting Time', 6),
  ('cleanliness', 'Cleanliness', 7),
  ('price_value', 'Price / Value', 8),
  ('promotion', 'Promotion', 9),
  ('portion', 'Portion', 10),
  ('side_dishes', 'Side Dishes', 11),
  ('soup', 'Soup', 12),
  ('atmosphere', 'Atmosphere', 13),
  ('accessibility', 'Accessibility', 14),
  ('other', 'Other', 15);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  google_review_id text not null unique,
  store_id uuid not null references stores (id),
  reviewer_name text,
  rating smallint not null check (rating between 1 and 5),
  review_text text,
  google_created_at timestamptz not null,
  -- Manila-local date the review counts toward ("New Review" definition)
  local_review_date date generated always as ((google_created_at at time zone 'Asia/Manila')::date) stored,
  google_updated_at timestamptz,
  updated_at timestamptz not null default now()
);
create index reviews_store_date_idx on reviews (store_id, local_review_date);

create table review_analysis (
  review_id uuid primary key references reviews (id) on delete cascade,
  sentiment text not null check (sentiment in ('positive', 'neutral', 'negative', 'mixed')),
  sentiment_score real,
  summary_ko text,
  is_critical boolean not null default false,
  model text,
  prompt_version text,
  -- the review's google_updated_at at analysis time; re-analyze when it changes
  source_updated_at timestamptz,
  analyzed_at timestamptz not null default now()
);

create table review_topics (
  review_id uuid not null references reviews (id) on delete cascade,
  topic_key text not null references topics (key),
  polarity text not null check (polarity in ('positive', 'negative')),
  label text not null,
  primary key (review_id, topic_key, polarity, label)
);
create index review_topics_label_idx on review_topics (label, polarity);

-- Google cumulative rating, captured once per day by the sync job
create table store_daily_snapshot (
  date date not null,
  store_id uuid not null references stores (id),
  google_avg_rating numeric(3, 2) not null,
  google_total_reviews int not null,
  primary key (date, store_id)
);

create table daily_store_summary (
  date date not null,
  store_id uuid not null references stores (id),
  new_review_count int not null,
  avg_rating numeric(3, 2),
  positive_count int not null,
  neutral_count int not null,
  negative_count int not null,
  critical_count int not null,
  status text not null check (status in ('good', 'watch', 'critical')),
  ai_summary text,
  positive_insights jsonb not null default '[]',
  negative_insights jsonb not null default '[]',
  prompt_version text,
  generated_at timestamptz not null default now(),
  primary key (date, store_id)
);

create table daily_global_summary (
  date date primary key,
  new_review_count int not null,
  avg_rating numeric(3, 2),
  positive_count int not null,
  neutral_count int not null,
  negative_count int not null,
  ai_brief text,
  generated_at timestamptz not null default now()
);

create table sync_runs (
  id bigint generated always as identity primary key,
  target_date date not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  reviews_fetched int,
  reviews_analyzed int,
  error text
);

-- Rating-based daily counts (KPI source of truth; AI never computes numbers)
create view v_store_daily_counts as
select
  store_id,
  local_review_date as date,
  count(*) as new_review_count,
  round(avg(rating)::numeric, 2) as avg_rating,
  count(*) filter (where rating >= 4) as positive_count,
  count(*) filter (where rating = 3) as neutral_count,
  count(*) filter (where rating <= 2) as negative_count,
  count(*) filter (where rating <= 2) as critical_count
from reviews
group by store_id, local_review_date;

-- Dashboard is read-only for the browser; writes go through the server (service role).
alter table stores enable row level security;
alter table topics enable row level security;
alter table reviews enable row level security;
alter table review_analysis enable row level security;
alter table review_topics enable row level security;
alter table store_daily_snapshot enable row level security;
alter table daily_store_summary enable row level security;
alter table daily_global_summary enable row level security;
alter table sync_runs enable row level security;
