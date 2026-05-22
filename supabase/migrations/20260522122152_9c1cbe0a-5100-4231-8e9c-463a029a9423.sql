create or replace function public.hide_public_forfeit_quick_fights()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('forfeited', 'cancelled')
     or (
       new.status = 'completed'
       and (
         new.player_1_submission_url is null
         or new.player_2_submission_url is null
       )
     ) then
    new.hidden_at := coalesce(new.hidden_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_hide_public_forfeit_quick_fights on public.quick_fights;

create trigger trg_hide_public_forfeit_quick_fights
before insert or update of status, player_1_submission_url, player_2_submission_url
on public.quick_fights
for each row
execute function public.hide_public_forfeit_quick_fights();