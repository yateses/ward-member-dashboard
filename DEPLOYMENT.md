# Deploying FH5 Members to Cloudflare Pages

## Prerequisites

1. A Cloudflare account
2. Your project code in a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Repository

Make sure your repository contains:
- `package.json` with the build script
- `_redirects` file for Vue Router
- All your source code

## Step 2: Deploy to Cloudflare Pages

1. **Log into Cloudflare Dashboard**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Navigate to "Pages" in the sidebar

2. **Create a New Project**
   - Click "Create a project"
   - Choose "Connect to Git"
   - Select your repository

3. **Configure Build Settings**
   - **Framework preset**: None
   - **Build command**: `npm run deploy`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty if your project is in the root)

4. **Environment Variables** (if needed)
   - Add any environment variables your app needs
   - Note: Firebase config should be in your client-side code

5. **Deploy**
   - Click "Save and Deploy"
   - Cloudflare will build and deploy your app

## Step 3: Custom Domain (Optional)

1. In your Pages project settings
2. Go to "Custom domains"
3. Add your domain and follow the DNS setup instructions

## Step 4: Environment Variables

If you need to set environment variables for your app:

1. Go to your Pages project settings
2. Navigate to "Environment variables"
3. Add variables like:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - etc.

## Important Notes

- The `_redirects` file ensures Vue Router works correctly
- Your Firebase configuration should be in your client-side code
- The LCR automation features require a separate server deployment
- Make sure all your Firebase security rules are properly configured

## Troubleshooting

- If the build fails, check the build logs in Cloudflare Pages
- Ensure all dependencies are in `package.json`
- Verify the build output directory is `dist`
- Check that the `_redirects` file is in the root directory 