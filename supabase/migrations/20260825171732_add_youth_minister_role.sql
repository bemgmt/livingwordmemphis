-- Distinguish the youth minister from members and parents who only need
-- youth_ministry access. The follow-up migration applies its permissions after
-- this enum value has committed.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'youth_minister';
