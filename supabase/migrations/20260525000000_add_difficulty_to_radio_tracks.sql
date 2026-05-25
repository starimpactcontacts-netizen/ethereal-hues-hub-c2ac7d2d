alter table radio_tracks
  add column if not exists difficulty text
    check (difficulty in ('easy', 'normal', 'hard', 'nightmare'));
