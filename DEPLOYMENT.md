# Deployment Guide

This guide will help you deploy your AI Code Reviewer application to production.

## Overview

You need to deploy TWO parts:
1. **Backend** (Node.js + PostgreSQL) → Deploy to Render/Railway
2. **Frontend** (React + Vite) → Deploy to Vercel

## Step 1: Deploy Backend to Render

### 1.1 Prepare Your Code

Make sure you have committed all changes:
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 1.2 Create Render Account

1. Go to https://render.com and sign up
2. Connect your GitHub account

### 1.3 Create New Web Service

1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Select the `Backend` folder as the root directory

### 1.4 Configure Build Settings

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

**Environment Variables:**

Add these environment variables in Render Dashboard:

```
PORT=5000
DB_USER=your_db_user
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_PASS=your_db_password
DB_PORT=5432
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-frontend-url.vercel.app
GEMINI_API_KEY=your_gemini_api_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

> **Note:** You'll get the `FRONTEND_URL` after deploying to Vercel (Step 2). For now, leave it as `http://localhost:5173` and update it later.

### 1.5 Deploy

Click "Create Web Service" and wait for deployment to complete.

**Your backend URL will be:** `https://your-service-name.onrender.com`

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Prepare Environment Variables

Create a `.env.production` file in your `frontend` folder:

```bash
# In frontend/.env.production
VITE_API_URL=https://your-service-name.onrender.com
```

Replace `your-service-name` with your actual Render service name.

### 2.2 Update API Configuration

The `api.ts` file should already be updated to use environment variables:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

### 2.3 Deploy to Vercel

**Option A: Using Vercel CLI**

```bash
cd frontend
npm i -g vercel
vercel
```

Follow the prompts and select your settings.

**Option B: Using GitHub Integration**

1. Go to https://vercel.com and sign up
2. Import your GitHub repository
3. Select the `frontend` folder as the root directory
4. Add environment variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-service-name.onrender.com`
5. Deploy

### 2.4 Get Your Frontend URL

After deployment, Vercel will give you a URL like:
`https://ai-code-reviewer-xyz123.vercel.app`

---

## Step 3: Update Backend CORS

Go back to Render Dashboard and update the environment variable:

```
FRONTEND_URL=https://ai-code-reviewer-xyz123.vercel.app
```

Restart your backend service.

---

## Step 4: Update GitHub OAuth (Optional)

If using GitHub integration, update your GitHub OAuth App:

1. Go to https://github.com/settings/developers
2. Edit your OAuth App
3. Update **Authorization callback URL** to:
   ```
   https://your-backend-name.onrender.com/auth/github/callback
   ```

---

## Troubleshooting

### Issue: "Failed to fetch" or CORS errors

**Solution:**
1. Make sure `FRONTEND_URL` in backend matches your Vercel URL exactly
2. Check that CORS is properly configured in `app.js`
3. Ensure your backend is running (check Render logs)

### Issue: Database connection errors

**Solution:**
1. Verify all database credentials are correct
2. Make sure your PostgreSQL database allows connections from Render's IP
3. Check if your database is publicly accessible or use Render's PostgreSQL service

### Issue: JWT errors

**Solution:**
1. Make sure `JWT_SECRET` is set and is at least 32 characters long
2. Restart the backend after changing environment variables

### Issue: API calls still going to localhost

**Solution:**
1. Rebuild and redeploy the frontend after updating environment variables
2. Clear browser cache and hard refresh (Ctrl+Shift+R)
3. Check browser DevTools Network tab to see actual API URLs

---

## Alternative: Deploy Everything to Vercel (Serverless)

If you want to deploy both frontend and backend to Vercel:

1. Move backend to `api/` folder in frontend
2. Use Vercel serverless functions
3. Update database to use a cloud provider (Supabase, Neon, etc.)

This is more complex but keeps everything on one platform.

---

## Testing Your Deployment

After both deployments:

1. Open your Vercel frontend URL
2. Try to sign up a new user
3. Try to log in
4. Submit code for review
5. Check admin dashboard (login with admin credentials)

## Support

If you encounter issues:
1. Check Render logs (Dashboard → Logs)
2. Check Vercel deployment logs
3. Open browser DevTools → Network tab to see actual API calls
4. Verify all environment variables are set correctly

---

**Happy Deploying! 🚀**
