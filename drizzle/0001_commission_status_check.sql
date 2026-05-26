ALTER TABLE "orders"
  ADD CONSTRAINT "commission_status_check"
  CHECK ("commission_status" IN ('pending', 'held', 'manually_paid'));
