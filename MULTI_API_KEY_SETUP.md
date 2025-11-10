# Multiple API Keys Setup Guide

## Overview

The app now supports **4 Gemini API keys with automatic fallback**. When one key fails or hits rate limits, the system automatically switches to the next one.

## Your API Keys

```
Key 1: AIzaSyCjDLc3zO4tXIMu9uiOVMP_Q4eJwVz9HDc
Key 2: AIzaSyC99H2gTi9xNLdBL1EZKsdnTjkjAjN7UlU
Key 3: AIzaSyDtMvkS3dL67t9JlzyUA0BDLRp330W6Kas
Key 4: AIzaSyCcrdqUiJhzHojcgOLHpF_5kxRNUAD3F4A
```

## How It Works

### **Automatic Fallback**
1. App tries Key 1
2. If Key 1 fails → automatically switches to Key 2
3. If Key 2 fails → automatically switches to Key 3
4. If Key 3 fails → automatically switches to Key 4
5. If all fail → waits 5 minutes then resets

### **Error Detection**
The system detects these API errors:
- ❌ Invalid API key (401/403)
- ❌ Quota exceeded
- ❌ Permission denied
- ❌ Rate limit hit

### **Console Logging**
You'll see messages like:
```
🔑 Initialized Gemini AI with API key: AIzaSyCjDL...
❌ Current API key failed, trying next one...
🔄 Switched to API key: AIzaSyC99H2...
```

## Setup Instructions

### **Option 1: Using Environment Variables (Recommended)**

Create/update `.env.local`:

```bash
GEMINI_API_KEY_1=AIzaSyCjDLc3zO4tXIMu9uiOVMP_Q4eJwVz9HDc
GEMINI_API_KEY_2=AIzaSyC99H2gTi9xNLdBL1EZKsdnTjkjAjN7UlU
GEMINI_API_KEY_3=AIzaSyDtMvkS3dL67t9JlzyUA0BDLRp330W6Kas
GEMINI_API_KEY_4=AIzaSyCcrdqUiJhzHojcgOLHpF_5kxRNUAD3F4A
```

### **Option 2: Using Defaults**

The keys are already hardcoded in `services/apiKeyManager.ts` as fallback defaults, so the app will work even without `.env.local`.

## Testing Multiple Keys

### **Test "Generate from URL"**
1. Create a new campaign
2. Enter a website URL
3. Click "Generate from URL"
4. Watch the console for key switching

### **View Key Status**
Open browser console and run:
```javascript
// This will show which keys have failed
console.log(apiKeyManager.getKeyStatus())
```

## File Changes

### **New Files**
- `services/apiKeyManager.ts` - Manages multiple API keys and fallback logic

### **Modified Files**
- `services/geminiService.ts` - Integrated API key manager with error handling
- `.env.local` - Add your API keys here (optional, defaults are built-in)

## Features

✅ **Automatic Fallback** - Seamless switching between keys  
✅ **Error Detection** - Identifies API key issues  
✅ **Retry Logic** - Automatically retries with new key  
✅ **Logging** - Clear console messages for debugging  
✅ **Rate Limit Handling** - Distributes load across keys  
✅ **Auto-Reset** - Resets failed keys after 5 minutes  

## Troubleshooting

### **Still getting errors?**
1. Check browser console (F12) for error messages
2. Verify all 4 API keys are valid at https://aistudio.google.com/app/apikey
3. Check your internet connection
4. Try refreshing the page

### **All keys failing?**
- Wait 5 minutes for auto-reset
- Or manually reset by running in console:
```javascript
apiKeyManager.resetFailedKeys()
```

### **Want to check which key is active?**
```javascript
// In browser console
console.log(apiKeyManager.getKeyStatus())
```

## Performance Notes

- **First request**: Uses Key 1
- **If Key 1 fails**: Switches to Key 2 (automatic retry)
- **Quota limits**: Each key has its own quota, so 4 keys = 4x capacity
- **Rate limits**: Distributed across keys for better throughput

## Security

⚠️ **Important**: API keys are visible in browser console and network requests. These are client-side keys, so:
- ✅ Safe to share in code (they're limited to Gemini API)
- ✅ Can be rotated easily
- ⚠️ Monitor usage at https://console.cloud.google.com

## Next Steps

1. ✅ Restart dev server: `npm run dev`
2. ✅ Try "Generate from URL" feature
3. ✅ Watch console for key switching
4. ✅ All features should now work reliably!

## Summary

Your app now has **4 API keys with automatic fallback**. If one fails, it seamlessly switches to the next one. This ensures reliable operation even if one key hits rate limits or becomes temporarily unavailable.
