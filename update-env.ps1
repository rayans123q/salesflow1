$envContent = @"
# Gemini API Key
GEMINI_API_KEY=AIzaSyCcrdqUiJhzHojcgOLHpF_5kxRNUAD3F4A

# Company Reddit API Credentials
VITE_COMPANY_REDDIT_CLIENT_ID=sgLL2ZBMG8cToyNQwLGbvlkWyYRvlw
VITE_COMPANY_REDDIT_CLIENT_SECRET=FfBhxWVwB-jNkba4tUuSdQ
"@

$envContent | Out-File -FilePath ".env.local" -Encoding utf8
Write-Host "Updated .env.local successfully" -ForegroundColor Green
