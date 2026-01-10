-- Make driver_id nullable for manual bonuses (company-wide bonuses don't need a driver)
ALTER TABLE public.bonuses ALTER COLUMN driver_id DROP NOT NULL;