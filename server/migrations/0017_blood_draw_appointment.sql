-- The admin schedules the member's blood-draw appointment at Innoquest. Stored
-- on the active lab order; it becomes visible to the member only when the form
-- is released (same gate as form_released_at).

alter table app.lab_orders
  add column if not exists blood_draw_at timestamptz;
