-- Fix RLS policy for admin_notifications to allow system inserts
-- This allows the notify_admin_new_signup trigger to work properly

-- Drop existing policy
DROP POLICY IF EXISTS "Service can insert notifications" ON admin_notifications;

-- Create new policy that allows all inserts (system-level)
CREATE POLICY "Allow system inserts for notifications"
  ON admin_notifications FOR INSERT
  WITH CHECK (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'admin_notifications';
