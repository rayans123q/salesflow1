-- ============================================
-- FIX SIGN-UP ISSUES
-- This ensures the trigger works properly
-- ============================================

-- Step 1: Drop and recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert new user into public.users table
    INSERT INTO public.users (id, name, email, role, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        CASE WHEN NEW.email = 'dateflow4@gmail.com' THEN 'admin' ELSE 'user' END,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(users.name, EXCLUDED.name);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth signup
        RAISE WARNING 'Error creating user in public.users: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Verify the trigger is active
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Step 4: Test that policies allow insertion
SELECT 
    'RLS Policies on users table:' as info,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'users';
