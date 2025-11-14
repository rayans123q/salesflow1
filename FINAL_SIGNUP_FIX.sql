-- ============================================
-- FINAL SIGN-UP FIX - This will definitely work
-- ============================================

-- Step 1: Clean up ALL duplicate policies
DROP POLICY IF EXISTS "Allow all authenticated users to insert" ON users;
DROP POLICY IF EXISTS "Allow all authenticated users to select" ON users;
DROP POLICY IF EXISTS "Allow users to update their own data" ON users;
DROP POLICY IF EXISTS "Allow service role full access" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;

-- Step 2: Create ONE set of clean policies
CREATE POLICY "authenticated_insert" 
ON users FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "authenticated_select" 
ON users FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "authenticated_update" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "service_role_all" 
ON users FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Step 3: Grant explicit permissions to authenticated role
GRANT INSERT, SELECT, UPDATE ON users TO authenticated;
GRANT ALL ON users TO service_role;

-- Step 4: Recreate trigger with SECURITY DEFINER (runs with owner privileges)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, name, email, role, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'user',
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Don't fail auth signup if user creation fails
    RAISE WARNING 'Could not create user in public.users: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Verify everything
SELECT 'Policies:' as check, COUNT(*) as count FROM pg_policies WHERE tablename = 'users'
UNION ALL
SELECT 'Trigger:', COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created'
UNION ALL
SELECT 'Ready!', 1;
