@echo off
echo Setting Reddit API Credentials...
echo.

REM Create .env.local file with Reddit credentials
(
echo # Gemini API Key
echo GEMINI_API_KEY=YOUR_GEMINI_KEY_HERE
echo.
echo # Company Reddit API Credentials
echo VITE_COMPANY_REDDIT_CLIENT_ID=sgLL2ZBMG8cToyNQwLGbvlkWyYRvlw
echo VITE_COMPANY_REDDIT_CLIENT_SECRET=FfBhxWVwB-jNkba4tUuSdQ
) > .env.local

echo ✓ Created .env.local with Reddit credentials
echo.
echo IMPORTANT: Add your Gemini API key to .env.local
echo Then restart the dev server with: npm run dev
echo.
pause
