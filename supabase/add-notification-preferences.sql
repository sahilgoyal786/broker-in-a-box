-- Add notification preference to brokers table
ALTER TABLE brokers 
ADD COLUMN notification_preference TEXT DEFAULT 'exception_based'
CHECK (notification_preference IN ('real_time', 'daily_digest', 'exception_based', 'dashboard_only'));

-- Add comment explaining the field
COMMENT ON COLUMN brokers.notification_preference IS 'How broker wants to be notified: real_time, daily_digest, exception_based (default), dashboard_only';
