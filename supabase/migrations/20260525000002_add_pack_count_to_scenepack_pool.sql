alter table scenepack_pool
  add column if not exists pack_count integer not null default 0;
