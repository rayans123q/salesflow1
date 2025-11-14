-- Fix Admin User Management
-- Add policies to allow admins to edit and delete users

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Admins can delete any user" ON users;

-- Create admin policies for users table
CREATE POLICY "Admins can update any user" ON users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete any user" ON users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Also ensure admins can update user_settings for any user
DROP POLICY IF EXISTS "Admins can update any user settings" ON user_settings;

CREATE POLICY "Admins can update any user settings" ON user_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('users', 'user_settings')
AND policyname LIKE '%Admin%'
ORDER BY tablename, policyname;
