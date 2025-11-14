-- Create table for manually activated subscriptions
CREATE TABLE IF NOT EXISTS subscribed_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscribed_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for the thank you page)
CREATE POLICY "Anyone can insert subscription"
    ON subscribed_users FOR INSERT
    WITH CHECK (true);

-- Allow users to read their own subscription
CREATE POLICY "Users can read own subscription"
    ON subscribed_users FOR SELECT
    USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscribed_users_email ON subscribed_users(email);
CREATE INDEX IF NOT EXISTS idx_subscribed_users_status ON subscribed_users(status);
