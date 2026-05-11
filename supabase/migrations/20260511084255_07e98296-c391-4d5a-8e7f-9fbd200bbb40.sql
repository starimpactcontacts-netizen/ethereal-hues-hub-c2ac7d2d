DELETE FROM public.collab_battles WHERE slot_a_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3' OR slot_b_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3';
DELETE FROM public.collab_battle_judges WHERE battle_id IN (SELECT id FROM public.collab_battles WHERE slot_a_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3' OR slot_b_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3');
DELETE FROM public.collab_reactions WHERE slot_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3';
DELETE FROM public.collab_messages WHERE slot_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3';
DELETE FROM public.collab_invites WHERE slot_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3';
DELETE FROM public.collab_daily_winners WHERE slot_id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3';
DELETE FROM public.collab_slots WHERE id = 'd83aedb3-672a-4071-aaa7-824a607eb4f3';