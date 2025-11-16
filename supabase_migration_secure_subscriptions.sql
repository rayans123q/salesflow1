-- Secure Subscription System Migration
-- Adds fields for Whop integration and webhook handling

-- Add new columns to subscribed_users table
ALTER TABLE subscribed_users 
ADD COLUMN IF NOT EXISTS whop_membership_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscribed_users_whop_membership ON subscribed_users(whop_membership_id);
CREATE INDEX IF NOT EXISTS idx_subscribed_users_verification_token ON subscribed_users(verification_token);

-- Add comments for documentation
COMMENT ON COLUMN subscribed_users.whop_membership_id IS 'Whop membership ID for verification';
COMMENT ON COLUMN subscribed_users.expires_at IS 'When the subscription expires';
COMMENT ON COLUMN subscribed_users.cancelled_at IS 'When the subscription was cancelled';
COMMENT ON COLUMN subscribed_users.payment_verified IS 'Whether payment was verified via Whop webhook';
COMMENT ON COLUMN subscribed_users.verification_token IS 'One-time token for thank you page access';

-- Function to clean up expired subscriptions (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE subscribed_users
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
    
  RAISE NOTICE 'Cleaned up expired subscriptions';
END;
$$ LANGUAGE plpgsql;

-- Create a table to log webhook events for debugging
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT
);

-- Enable RLS on webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook logs
CREATE POLICY "Admins can view webhook logs"
  ON webhook_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create index for webhook logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed_at ON webhook_logs(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);

COMMENT ON TABLE webhook_logs IS 'Logs all webhook events from Whop for debugging and audit';
