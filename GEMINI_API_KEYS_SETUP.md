# Multiple Gemini API Keys Setup

## How to Add Multiple API Keys

Your app now supports **automatic API key rotation**! When one key gets overloaded or hits its quota, the system automatically switches to the next available key.

### Step 1: Add Your API Keys to `.env.local`

Open your `.env.local` file and add multiple Gemini API keys separated by commas:

```env
# Gemini API Keys (comma-separated for automatic rotation)
VITE_GEMINI_API_KEYS=AIzaSyCcrdqUiJhzHojcgOLHpF_5kxRNUAD3F4A,AIzaSyAnotherKey123456789,AIzaSyYetAnotherKey987654321
```

### Example with 5 Keys:

```env
VITE_GEMINI_API_KEYS=AIzaSyCcrdqUiJhzHojcgOLHpF_5kxRNUAD3F4A,AIzaSyC99H2gTi9xNLdBL1EZKsdnTjkjAjN7UlU,AIzaSyDtMvkS3dL67t9JlzyUA0BDLRp330W6Kas,AIzaSyCjDLc3zO4tXIMu9uiOVMP_Q4eJwVz9HDc,AIzaSyAnotherKey123456789
```

### Step 2: Restart Your Dev Server

After adding keys, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev -- --port 3000
```

## How It Works

### Automatic Rotation
1. **Start**: Uses the first API key
2. **Error Detected**: If a key fails (quota exceeded, rate limit, etc.)
3. **Auto-Switch**: Automatically switches to the next available key
4. **Continue**: Your app keeps working without interruption

### Smart Tracking
- ✅ Tracks which keys have failed
- ✅ Skips failed keys automatically
- ✅ Resets after 5 minutes (gives keys time to recover)
- ✅ Logs all key switches in the console

### Console Messages You'll See

```
🔑 Loaded 5 Gemini API key(s) from VITE_GEMINI_API_KEYS
🔑 Initialized Gemini AI with API key: AIzaSyCcrd...
❌ Current API key failed, trying next one...
🔄 Switched to API key: AIzaSyC99H...
✅ Successfully using backup API key
```

## Getting More API Keys

### Option 1: Google AI Studio (Free)
1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key
4. Add it to your `.env.local` file

### Option 2: Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Create a new project (or use existing)
3. Enable "Generative Language API"
4. Create credentials → API Key
5. Copy and add to `.env.local`

## Benefits

✅ **No Downtime**: Automatic failover when one key is exhausted
✅ **Higher Limits**: Combine quotas from multiple keys
✅ **Better Reliability**: If one key fails, others keep working
✅ **Easy Management**: Just add keys separated by commas
✅ **Smart Recovery**: Failed keys are retried after 5 minutes

## Monitoring

Check the browser console to see:
- Which key is currently active
- When keys are switched
- Status of all keys

## Troubleshooting

### "All API keys have failed"
- Wait 5 minutes for automatic reset
- Check that your keys are valid
- Verify you haven't exceeded daily quotas on all keys

### Keys not loading
- Make sure keys are comma-separated with no spaces
- Restart your dev server after adding keys
- Check the console for "Loaded X Gemini API key(s)" message

## Current Configuration

Your current `.env.local` has:
- 1 API key configured
- Ready to add more!

Just add more keys separated by commas and restart the server.
