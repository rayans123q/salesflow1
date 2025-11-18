-- Add auto-refresh functionality to campaigns table

-- Add auto-refresh columns
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS auto_refresh_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_refresh_interval TEXT DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS next_auto_refresh TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add check constraint for valid intervals
ALTER TABLE campaigns 
ADD CONSTRAINT valid_auto_refresh_interval 
CHECK (auto_refresh_interval IN ('daily', 'every12hours', 'every6hours', 'every3hours'));

-- Create index for efficient querying of campaigns due for refresh
CREATE INDEX IF NOT EXISTS idx_campaigns_auto_refresh 
ON campaigns(auto_refresh_enabled, next_auto_refresh) 
WHERE auto_refresh_enabled = TRUE;

-- Update existing active campaigns to have a default next_auto_refresh if they enable it
-- (This will be set when user enables auto-refresh in the UI)

COMMENT ON COLUMN campaigns.auto_refresh_enabled IS 'Whether auto-refresh is enabled for this campaign';
COMMENT ON COLUMN campaigns.auto_refresh_interval IS 'How often to auto-refresh: daily, every12hours, every6hours, every3hours';
COMMENT ON COLUMN campaigns.next_auto_refresh IS 'Timestamp when this campaign should be auto-refreshed next';
