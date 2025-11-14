-- ============================================
-- COMPLETE AUTHENTICATION RESET & FIX
-- This will create a fresh admin user
-- ============================================

-- Step 1: Check if the user exists in auth.users
DO $$
BEGIN
    -- If user doesn't exist in auth, we can't do anything here
    -- User must sign up through the app first
    RAISE NOTICE 'Checking authentication setup...';
END $$;

-- Step 2: Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow authenticated insert" ON users;

-- Step 4: Create VERY permissive policies for testing
CREATE POLICY "Allow all authenticated users to insert" 
ON users FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to select" 
ON users FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow users to update their own data" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow service role full access" 
ON users FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Step 5: Create a function to auto-create user in public.users after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, email, role, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        CASE WHEN NEW.email = 'dateflow4@gmail.com' THEN 'admin' ELSE 'user' END,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger to auto-create user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Sync existing auth users to public.users
INSERT INTO users (id, name, email, role, created_at)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
    email,
    CASE WHEN email = 'dateflow4@gmail.com' THEN 'admin' ELSE 'user' END,
    created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(users.name, EXCLUDED.name),
    role = CASE WHEN EXCLUDED.email = 'dateflow4@gmail.com' THEN 'admin' ELSE users.role END;

-- Step 8: Verify setup
SELECT 
    'Setup Complete!' as status,
    (SELECT COUNT(*) FROM auth.users) as auth_users,
    (SELECT COUNT(*) FROM users) as public_users,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users;
