# GitHub + Netlify Deployment Guide for InvestPro

## Quick Start: 5-Step Deployment Process

### Step 1: Push to GitHub

`ash
cd "C:\Users\jiggy\OneDrive\Documents\INVESTMENT"
git add .
git commit -m "Production ready deployment"
git push origin main
`

### Step 2: Deploy on Netlify

1. Go to https://app.netlify.com/signup
2. Sign in with GitHub
3. Import your investment-platform repository
4. Click "Deploy site"

### Step 3: Add Environment Variables

In Netlify Dashboard → Site Configuration → Environment variables:

| Key | Value |
|-----|-------|
| NODE_ENV | production |
| NEXTAUTH_SECRET | \openssl rand -base64 32\ |
| JWT_SECRET | \openssl rand -base64 32\ |
| DATABASE_URL | Your PostgreSQL connection string |
| NEXTAUTH_URL | https://your-app.netlify.app |

### Step 4: Build Automatically

Netlify will automatically build when you push to GitHub.

First build takes 5-15 minutes, subsequent builds take ~3 minutes.

### Step 5: Verify Deployment

Visit your site and test:
- https://your-app.netlify.app (homepage)
- /api/health (health check)
- /login (auth page)

---

## Detailed Instructions

Follow this comprehensive guide for production deployment.
