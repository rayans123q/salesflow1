$envContent = @"
# Gemini API Key
GEMINI_API_KEY=AIzaSyCcrdqUiJhzHojcgOLHpF_5kxRNUAD3F4A

# Company Reddit API Credentials
VITE_COMPANY_REDDIT_CLIENT_ID=sgLL2ZBMG8cToyNQwLGbvlkWyYRvlw
VITE_COMPANY_REDDIT_CLIENT_SECRET=FfBhxWVwB-jNkba4tUuSdQ

# Supabase Configuration
VITE_SUPABASE_URL=https://zimlbwfmiakbwijwmcpq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbWxid2ZtaWFrYndpandtY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODEyNDYsImV4cCI6MjA3ODI1NzI0Nn0.ba2TSnunwGp2jh5lgtIqXzdmhfnDZVh8PTpz-GouJnU
"@

$envContent | Out-File -FilePath ".env.local" -Encoding utf8
Write-Host "Updated .env.local with Supabase credentials" -ForegroundColor Green
