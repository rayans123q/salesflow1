-- Analytics tracking for visitor data
-- Tracks page views, devices, and traffic sources

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- 'page_view', 'signup', 'campaign_created', etc.
  user_id TEXT, -- NULL for anonymous visitors
  session_id TEXT NOT NULL, -- Unique session identifier
  page_path TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device_type VARCHAR(20), -- 'mobile', 'tablet', 'desktop'
  browser VARCHAR(50),
  os VARCHAR(50),
  country VARCHAR(2), -- ISO country code
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_utm_source ON analytics_events(utm_source);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert analytics events (for tracking)
CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only admins can read analytics events
CREATE POLICY "Only admins can read analytics"
  ON analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to get daily visitor stats
CREATE OR REPLACE FUNCTION get_daily_visitor_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  date DATE,
  total_visitors BIGINT,
  unique_visitors BIGINT,
  page_views BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT session_id) as total_visitors,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_visitors,
    COUNT(*) FILTER (WHERE event_type = 'page_view') as page_views
  FROM analytics_events
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$;

-- Function to get device breakdown
CREATE OR REPLACE FUNCTION get_device_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  device_type VARCHAR(20),
  visitor_count BIGINT,
  percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH device_counts AS (
    SELECT 
      COALESCE(device_type, 'unknown') as device,
      COUNT(DISTINCT session_id) as count
    FROM analytics_events
    WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY device_type
  ),
  total_count AS (
    SELECT SUM(count) as total FROM device_counts
  )
  SELECT 
    dc.device,
    dc.count,
    ROUND((dc.count::NUMERIC / tc.total::NUMERIC) * 100, 2) as percentage
  FROM device_counts dc, total_count tc
  ORDER BY dc.count DESC;
END;
$$;

-- Function to get traffic sources
CREATE OR REPLACE FUNCTION get_traffic_sources(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  source VARCHAR(255),
  visitor_count BIGINT,
  percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH source_counts AS (
    SELECT 
      CASE 
        WHEN utm_source IS NOT NULL THEN utm_source
        WHEN referrer IS NOT NULL AND referrer != '' THEN 
          CASE
            WHEN referrer LIKE '%google%' THEN 'Google'
            WHEN referrer LIKE '%facebook%' THEN 'Facebook'
            WHEN referrer LIKE '%twitter%' OR referrer LIKE '%x.com%' THEN 'Twitter/X'
            WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
            WHEN referrer LIKE '%reddit%' THEN 'Reddit'
            ELSE 'Referral'
          END
        ELSE 'Direct'
      END as source,
      COUNT(DISTINCT session_id) as count
    FROM analytics_events
    WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    AND event_type = 'page_view'
    GROUP BY source
  ),
  total_count AS (
    SELECT SUM(count) as total FROM source_counts
  )
  SELECT 
    sc.source,
    sc.count,
    ROUND((sc.count::NUMERIC / tc.total::NUMERIC) * 100, 2) as percentage
  FROM source_counts sc, total_count tc
  ORDER BY sc.count DESC;
END;
$$;

-- Function to get recent visitors (last 100)
CREATE OR REPLACE FUNCTION get_recent_visitors(limit_count INTEGER DEFAULT 100)
RETURNS TABLE(
  session_id TEXT,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  page_views BIGINT,
  device_type VARCHAR(20),
  browser VARCHAR(50),
  source VARCHAR(255),
  user_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ae.session_id,
    MIN(ae.created_at) as first_seen,
    MAX(ae.created_at) as last_seen,
    COUNT(*) FILTER (WHERE ae.event_type = 'page_view') as page_views,
    MAX(ae.device_type) as device_type,
    MAX(ae.browser) as browser,
    COALESCE(MAX(ae.utm_source), 
      CASE 
        WHEN MAX(ae.referrer) LIKE '%google%' THEN 'Google'
        WHEN MAX(ae.referrer) LIKE '%facebook%' THEN 'Facebook'
        WHEN MAX(ae.referrer) LIKE '%twitter%' THEN 'Twitter/X'
        ELSE 'Direct'
      END
    ) as source,
    MAX(ae.user_id) as user_id
  FROM analytics_events ae
  GROUP BY ae.session_id
  ORDER BY MAX(ae.created_at) DESC
  LIMIT limit_count;
END;
$$;

-- Add comment
COMMENT ON TABLE analytics_events IS 'Tracks visitor analytics including page views, devices, and traffic sources';
