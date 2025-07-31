# Security Guide for FH5 Members App

## 🔐 API Key Security

### What Happened
GitHub detected that your Firebase API key was exposed in a public repository. This is a security risk that needs immediate attention.

### Immediate Actions Required

1. **Revoke the exposed API key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to your Firebase project (`bishop-ministry`)
   - Go to **APIs & Services** → **Credentials**
   - Find and **delete** the exposed API key: `AIzaSyDH_2FVGuVlz_WOH71xrHu5XE4qGevkEXk`

2. **Generate a new API key:**
   - In the same Credentials section, create a new API key
   - Copy the new key for use in environment variables

3. **Set up environment variables:**
   - Create a `.env` file in your project root (it's already in `.gitignore`)
   - Add your new Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_new_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=bishop-ministry.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bishop-ministry
VITE_FIREBASE_STORAGE_BUCKET=bishop-ministry.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=350752679794
VITE_FIREBASE_APP_ID=1:350752679794:web:a902f0a6a1bf7f2189dfeb
```

### For Cloudflare Pages Deployment

When deploying to Cloudflare Pages, add these environment variables in the Cloudflare dashboard:

1. Go to your Pages project settings
2. Navigate to "Environment variables"
3. Add each variable with the `VITE_` prefix

### Security Best Practices

- ✅ **Never commit API keys to Git repositories**
- ✅ **Use environment variables for all sensitive data**
- ✅ **Keep `.env` files in `.gitignore`**
- ✅ **Use different API keys for development and production**
- ✅ **Regularly rotate API keys**
- ✅ **Monitor for unauthorized usage**

### Firebase Security Rules

Make sure your Firestore security rules are properly configured to prevent unauthorized access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Add appropriate rules for your use case
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Monitoring

- Check Firebase Console for unusual activity
- Monitor API usage in Google Cloud Console
- Set up alerts for unexpected API usage 