-- Allow deleting from scenepack_pool even when referenced by battles/fights.
-- Rows in battles/quick_fights that pointed to the deleted pack simply get NULL.

ALTER TABLE battles
  DROP CONSTRAINT IF EXISTS battles_scenepack_option_a_id_fkey,
  DROP CONSTRAINT IF EXISTS battles_scenepack_option_b_id_fkey,
  DROP CONSTRAINT IF EXISTS battles_scenepack_locked_id_fkey;
ALTER TABLE battles
  ADD CONSTRAINT battles_scenepack_option_a_id_fkey  FOREIGN KEY (scenepack_option_a_id) REFERENCES scenepack_pool(id) ON DELETE SET NULL,
  ADD CONSTRAINT battles_scenepack_option_b_id_fkey  FOREIGN KEY (scenepack_option_b_id) REFERENCES scenepack_pool(id) ON DELETE SET NULL,
  ADD CONSTRAINT battles_scenepack_locked_id_fkey    FOREIGN KEY (scenepack_locked_id)   REFERENCES scenepack_pool(id) ON DELETE SET NULL;

ALTER TABLE cash_battles
  DROP CONSTRAINT IF EXISTS cash_battles_scenepack_option_a_id_fkey,
  DROP CONSTRAINT IF EXISTS cash_battles_scenepack_option_b_id_fkey,
  DROP CONSTRAINT IF EXISTS cash_battles_scenepack_locked_id_fkey;
ALTER TABLE cash_battles
  ADD CONSTRAINT cash_battles_scenepack_option_a_id_fkey  FOREIGN KEY (scenepack_option_a_id) REFERENCES scenepack_pool(id) ON DELETE SET NULL,
  ADD CONSTRAINT cash_battles_scenepack_option_b_id_fkey  FOREIGN KEY (scenepack_option_b_id) REFERENCES scenepack_pool(id) ON DELETE SET NULL,
  ADD CONSTRAINT cash_battles_scenepack_locked_id_fkey    FOREIGN KEY (scenepack_locked_id)   REFERENCES scenepack_pool(id) ON DELETE SET NULL;

ALTER TABLE quick_fights
  DROP CONSTRAINT IF EXISTS quick_fights_scenepack_option_a_id_fkey,
  DROP CONSTRAINT IF EXISTS quick_fights_scenepack_option_b_id_fkey,
  DROP CONSTRAINT IF EXISTS quick_fights_scenepack_locked_id_fkey;
ALTER TABLE quick_fights
  ADD CONSTRAINT quick_fights_scenepack_option_a_id_fkey  FOREIGN KEY (scenepack_option_a_id) REFERENCES scenepack_pool(id) ON DELETE SET NULL,
  ADD CONSTRAINT quick_fights_scenepack_option_b_id_fkey  FOREIGN KEY (scenepack_option_b_id) REFERENCES scenepack_pool(id) ON DELETE SET NULL,
  ADD CONSTRAINT quick_fights_scenepack_locked_id_fkey    FOREIGN KEY (scenepack_locked_id)   REFERENCES scenepack_pool(id) ON DELETE SET NULL;
