-- Fix User Creation Permissions
-- This allows authenticated users to create their own user record

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own record" ON users;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to INSERT their own record
CREATE POLICY "Users can insert their own record"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Allow users to SELECT their own record
CREATE POLICY "Users can view their own record"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Allow users to UPDATE their own record
CREATE POLICY "Users can update their own record"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Also fix user_settings table permissions
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own settings"
ON user_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own settings"
ON user_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON user_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix visitor_analytics table (allow inserts)
DROP POLICY IF EXISTS "Anyone can insert visitor analytics" ON visitor_analytics;

CREATE POLICY "Anyone can insert visitor analytics"
ON visitor_analytics
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('users', 'user_settings', 'visitor_analytics')
ORDER BY tablename, policyname;
