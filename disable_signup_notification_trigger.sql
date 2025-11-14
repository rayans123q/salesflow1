-- Disable the trigger that creates admin notifications on user signup
-- This is causing RLS policy violations for new users

-- Drop the trigger first (must be done before dropping the function)
DROP TRIGGER IF EXISTS trigger_notify_admin_new_signup ON users;
DROP TRIGGER IF EXISTS on_user_signup_notify_admin ON users;

-- Now drop the function with CASCADE to remove any remaining dependencies
DROP FUNCTION IF EXISTS notify_admin_new_signup() CASCADE;

-- Verify triggers are removed
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname LIKE '%signup%';
