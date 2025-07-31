# Deployment Checklist for Cloudflare Pages

## ✅ Pre-Deployment Checklist

- [ ] Project builds successfully (`npm run build-only`)
- [ ] `_redirects` file is in the root directory
- [ ] Firebase configuration is properly set up
- [ ] All environment variables are documented
- [ ] Repository is pushed to Git (GitHub/GitLab/Bitbucket)

## 🚀 Cloudflare Pages Setup

### 1. Access Cloudflare Dashboard
- [ ] Go to [dash.cloudflare.com](https://dash.cloudflare.com)
- [ ] Navigate to "Pages" section

### 2. Create New Project
- [ ] Click "Create a project"
- [ ] Choose "Connect to Git"
- [ ] Select your repository
- [ ] Authorize Cloudflare to access your repository

### 3. Configure Build Settings
- [ ] **Framework preset**: None
- [ ] **Build command**: `npm run deploy`
- [ ] **Build output directory**: `dist`
- [ ] **Root directory**: `/` (leave empty)

### 4. Environment Variables (if needed)
- [ ] Add any required environment variables
- [ ] Note: Firebase config is already in client-side code

### 5. Deploy
- [ ] Click "Save and Deploy"
- [ ] Monitor build process
- [ ] Verify deployment success

## 🔧 Post-Deployment

- [ ] Test all major functionality
- [ ] Verify Firebase connections work
- [ ] Check that routing works correctly
- [ ] Test on different devices/browsers
- [ ] Set up custom domain (optional)

## 📝 Important Notes

- **LCR Automation**: The one-click import feature requires a separate server deployment
- **Firebase Security**: Ensure your Firestore security rules allow read/write access
- **Environment Variables**: If you need to add any, they should be prefixed with `VITE_` for Vite to include them

## 🆘 Troubleshooting

If deployment fails:
1. Check build logs in Cloudflare Pages
2. Verify all dependencies are in `package.json`
3. Ensure `_redirects` file is in root directory
4. Check that build output directory is `dist`
5. Verify Firebase configuration is correct 