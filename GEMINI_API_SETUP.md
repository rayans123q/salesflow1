# Gemini API Setup Guide

## Overview
This application uses Google's Gemini API for AI-powered lead finding and comment generation. Follow these steps to set up your API key.

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" or "Get API Key"
4. Copy your API key (it will look something like: `AIzaSy...`)

## Step 2: Add API Key to Environment File

1. Open the `.env.local` file in the root of this project
2. Replace `PLACEHOLDER_API_KEY` with your actual Gemini API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

**Important:** 
- Never commit your `.env.local` file to version control
- The `.env.local` file is already in `.gitignore` to protect your API key

## Step 3: Restart the Development Server

After adding your API key:

1. Stop the current development server (Ctrl+C in the terminal)
2. Restart it with: `npm run dev`
3. The application will now use your Gemini API key

## Step 4: Verify Setup

1. Open the application in your browser
2. Try creating a campaign or generating an AI comment
3. Check the browser console for any API key errors
4. If you see a warning about the API key, make sure:
   - The `.env.local` file exists in the project root
   - The key is set as `GEMINI_API_KEY=your_key`
   - You've restarted the development server

## Troubleshooting

### Error: "API key not found"
- Make sure the `.env.local` file exists in the project root (same directory as `package.json`)
- Verify the file contains: `GEMINI_API_KEY=your_key` (no quotes around the key)
- Restart the development server after adding the key

### Error: "Invalid API key"
- Verify you copied the entire API key correctly
- Make sure there are no extra spaces or quotes
- Try generating a new API key from Google AI Studio

### API Key Not Working
- Check your API key quota in [Google AI Studio](https://aistudio.google.com/app/apikey)
- Verify the API key has the necessary permissions
- Make sure you're using the correct API key (not a service account key)

## API Usage

The Gemini API is used for:
1. **Lead Finding**: Analyzing Reddit and Discord posts to find relevant leads
2. **Comment Generation**: Generating personalized, context-aware comments for engagement
3. **Campaign Analysis**: Scoring posts by relevance to your campaign

## Rate Limits

Google provides free tier access to the Gemini API with rate limits. Check the [Gemini API pricing page](https://ai.google.dev/pricing) for current limits and pricing.

## Security Notes

- **Never share your API key** publicly
- **Never commit** `.env.local` to version control
- **Rotate your API key** if it's accidentally exposed
- Consider setting up **API key restrictions** in Google Cloud Console for production use

## References

- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs/quickstart)
- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Pricing](https://ai.google.dev/pricing)

