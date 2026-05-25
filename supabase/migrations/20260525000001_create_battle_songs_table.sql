create table if not exists battle_songs (
  id           uuid        primary key default gen_random_uuid(),
  song_name    text        not null,
  artist_name  text,
  audio_url    text        not null,
  preview_url  text,
  cover_url    text,
  deezer_id    bigint      unique,
  difficulty   text        check (difficulty in ('easy', 'normal', 'hard', 'nightmare')),
  is_featured  boolean     not null default true,
  is_priority  boolean     not null default false,
  track_order  integer     not null default 0,
  created_at   timestamptz not null default now()
);

alter table battle_songs enable row level security;

create policy "battle_songs_public_read"
  on battle_songs for select using (true);

create policy "battle_songs_auth_write"
  on battle_songs for all using (auth.role() = 'authenticated');
