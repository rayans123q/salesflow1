-- Lead Scraper Feature Database Migration
-- Run this SQL in your Supabase SQL Editor

-- Table for storing scraped companies
CREATE TABLE IF NOT EXISTS scraped_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    emails TEXT[] DEFAULT '{}',
    social_media JSONB DEFAULT '{}',
    search_query TEXT, -- The original search query that found this company
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing individual contacts from scraped companies
CREATE TABLE IF NOT EXISTS scraped_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES scraped_companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT,
    social_media JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing generated outreach messages
CREATE TABLE IF NOT EXISTS outreach_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES scraped_contacts(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL CHECK (message_type IN ('email', 'dm')),
    subject TEXT, -- For emails
    message_content TEXT NOT NULL,
    user_offer TEXT, -- The user's offer used to generate this message
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing keyword search history
CREATE TABLE IF NOT EXISTS keyword_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    companies_found INTEGER DEFAULT 0,
    contacts_scraped INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scraped_companies_user_id ON scraped_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_scraped_companies_created_at ON scraped_companies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_contacts_user_id ON scraped_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_scraped_contacts_company_id ON scraped_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_user_id ON outreach_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_contact_id ON outreach_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_keyword_searches_user_id ON keyword_searches(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE scraped_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_searches ENABLE ROW LEVEL SECURITY;

-- Policies for scraped_companies
CREATE POLICY "Users can view their own scraped companies" ON scraped_companies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scraped companies" ON scraped_companies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scraped companies" ON scraped_companies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scraped companies" ON scraped_companies
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for scraped_contacts
CREATE POLICY "Users can view their own scraped contacts" ON scraped_contacts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scraped contacts" ON scraped_contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scraped contacts" ON scraped_contacts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scraped contacts" ON scraped_contacts
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for outreach_messages
CREATE POLICY "Users can view their own outreach messages" ON outreach_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outreach messages" ON outreach_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outreach messages" ON outreach_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outreach messages" ON outreach_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for keyword_searches
CREATE POLICY "Users can view their own keyword searches" ON keyword_searches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keyword searches" ON keyword_searches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keyword searches" ON keyword_searches
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keyword searches" ON keyword_searches
    FOR DELETE USING (auth.uid() = user_id);

-- Add user_offer field to user settings (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'user_offer') THEN
        ALTER TABLE users ADD COLUMN user_offer TEXT;
    END IF;
END $$;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_scraped_companies_updated_at BEFORE UPDATE ON scraped_companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scraped_contacts_updated_at BEFORE UPDATE ON scraped_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Lead Scraper database migration completed successfully!' as status;