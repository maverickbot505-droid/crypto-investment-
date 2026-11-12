# InvestPro - GitHub & Netlify Deployment Guide

## Quick 5-Step Deployment

### Step 1: Push Code to GitHub (2 minutes)

`powershell
cd "C:\Users\jiggy\OneDrive\Documents\INVESTMENT"

git add .
git commit -m "Production-ready investment platform"
git push origin main
`

### Step 2: Deploy on Netlify (1 minute)

1. Go to https://app.netlify.com/signup
2. Sign in with GitHub
3. Import your repository
4. Click "Deploy site"

Netlify will auto-detect and build your Next.js app!

### Step 3: Add Environment Variables (2 minutes)

In Netlify Dashboard → Site Configuration → Environment variables:

| Key | Value | How to Generate |
|-----|-------|-----------------|
| NODE_ENV | production | - |
| NEXTAUTH_SECRET | \openssl rand -base64 32\ | Run in terminal |
| JWT_SECRET | \openssl rand -base64 32\ | Run in terminal |
| DATABASE_URL | Your PostgreSQL connection string | From database provider |
| NEXTAUTH_URL | https://your-app.netlify.app | Your Netlify domain |

**Generate secrets:**
`powershell
# Copy these outputs to Netlify:
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For JWT_SECRET
`

### Step 4: Wait for Build (10-15 minutes first deploy)

Netlify will automatically:
- Pull code from GitHub
- Install dependencies (
pm install)
- Run production build (
pm run build)
- Deploy your site

**Build time:**
- First deploy: 10-20 minutes
- Subsequent deploys: 3-5 minutes

### Step 5: Visit Your Site!

Click "Visit site" button or go to your custom domain.

Test these URLs:
- Homepage: https://your-app.netlify.app
- Health check: /api/health
- Login page: /login

---

## Detailed Instructions

## GitHub Setup

### 1. Verify .gitignore

Your .gitignore is already configured correctly:
- ✅ node_modules excluded
- ✅ .env files excluded
- ✅ .next build folder excluded

No changes needed!

### 2. Commit and Push

`powershell
cd "C:\Users\jiggy\OneDrive\Documents\INVESTMENT"

# Add all files (gitignore will exclude sensitive ones)
git add .

# Commit with message
git commit -m "InvestPro platform ready for production deployment"

# Push to GitHub main branch
git push origin main
`

### 3. Create Repository on GitHub

1. Go to https://github.com
2. Click + → New repository
3. Name: investment-platform or investpro
4. Select Private (recommended)
5. Don't add README (you already have one)
6. Create repository
7. Copy the repository URL for step 2 above

### 4. Link Local Repo to GitHub

`powershell
# Get URL from your GitHub repository page
git remote add origin https://github.com/YOUR_USERNAME/INVESTMENT-PLATFORM.git

# Push code
git push -u origin main --force
`

## Netlify Configuration

### Option A: Auto Import (Recommended)

1. Go to https://app.netlify.com
2. Sign in with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your investment-platform repository
5. Click "Deploy site"

Netlify will automatically configure everything!

### Option B: Manual Setup

1. Create new site: https://app.netlify.com/create
2. After site is created, go to Site Configuration → Add deploy source → Git
3. Connect GitHub and select your repository
4. Configure build settings:
   - Build command: 
pm run build
   - Publish directory: .next/standalone

## Environment Variables (Required)

### Generate Secure Secrets

`powershell
# Open Command Prompt or PowerShell
cd "C:\Users\jiggy\OneDrive\Documents\INVESTMENT"

# Generate NEXTAUTH_SECRET (32 character random string)
openssl rand -base64 32

# Generate JWT_SECRET (another random string)
openssl rand -base64 32
`

**Example outputs to copy:**
- NEXTAUTH_SECRET: j8Kd9Xm2pLq5Rt7Wz1Bn4Cv6Yh0Sf3Ag2Dj5Fk8Gm1Hn4Jq
- JWT_SECRET: nother-very-long-random-string-for-jwt-signing

### Add to Netlify

1. In Netlify Dashboard → Your site → Site Configuration → Environment variables
2. Click "+ Add environment variable" for each one below

**Required Variables:**

| Key | Value | Description |
|-----|-------|-------------|
| NODE_ENV | production | Production mode |
| NEXTAUTH_SECRET | <paste-generated-secret> | JWT signing secret |
| JWT_SECRET | <paste-another-secret> | Additional JWT secret |
| DATABASE_URL | postgresql://user:pass@host:5432/db?sslmode=require | Database connection |
| NEXTAUTH_URL | https://your-app.netlify.app | Public app URL |

**Optional but Recommended:**

| Key | Value | Description |
|-----|-------|-------------|
| SMTP_HOST | smtp.gmail.com | Email server |
| SMTP_PORT | 587 | SMTP port |
| SMTP_USER | your-email@gmail.com | Your email |
| SMTP_PASS | Gmail app password | For sending emails |

**How to get Gmail app password:**
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Click "App passwords"
4. Select "Mail" and your device
5. Copy the 16-character password

Click "Save" after adding each variable!

## Build Process

### What Netlify Does Automatically

When you push to GitHub, Netlify automatically:

1. **Pull latest code** from your GitHub repository
2. **Install dependencies**: 
pm install (2-5 minutes)
3. **Run TypeScript compiler**: Compiles .ts/.tsx to JS
4. **Generate Prisma client**: Creates database types
5. **Build Next.js app**: Creates optimized .next/standalone folder
6. **Deploy site**: Makes it live on Netlify

### Monitoring Build Progress

In Netlify Dashboard → Deploys tab, you'll see:
- "Processing" - Pulling code from GitHub
- "Building" - Installing dependencies and compiling
- "Published" - Site is live!

**Build time estimates:**
- First build (first deploy): 10-20 minutes
- Subsequent builds: 3-5 minutes (much faster!)

### Viewing Build Logs

Click on any deploy in the Deploys tab to see detailed logs.

Look for green checkmarks ✅ = success
Red X ❌ = errors to fix

## Testing Your Deployment

### Step 1: Verify Site is Live

Visit your Netlify domain:
`
https://your-app-name.netlify.app
`

**Expected behavior:**
- Homepage loads without errors
- Navigation menu visible and working
- Login/Register buttons functional

### Step 2: Test Health Check Endpoint

Open browser and visit:
`
https://your-app.netlify.app/api/health
`

**Expected response:**
`json
{
  "status": "ok",
  "timestamp": "2026-11-11T...",
  "service": "investment-platform"
}
`

### Step 3: Test Core Functionality

1. **Registration Flow:**
   - Click "Register" or go to /register
   - Fill in registration form
   - Submit (check email for verification if enabled)
   - Verify account creation

2. **Login Flow:**
   - Click "Login"
   - Enter email and password
   - Verify successful login
   - Navigate to dashboard

3. **API Endpoints:**
   Test these in browser DevTools or curl:
   - /api/health - Should return status OK
   - /api/deposits - Should show deposits (if logged in)
   - /api/withdrawals - Should show withdrawals (if logged in)

### Step 4: Check Security Headers

Open DevTools → Network tab → Make any request → Click request → Response Headers.

**Should see:**
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ Content-Security-Policy: ...

## Troubleshooting

### Build Failed with "Cannot find module"

**Solution:**
`powershell
cd "C:\Users\jiggy\OneDrive\Documents\INVESTMENT"
rm -rf node_modules package-lock.json
npm install
npm run build
git add .
git commit -m "Fixed dependencies"
git push origin main
`

### Build Failed with Database Connection Error

**Solution:**
1. Check DATABASE_URL in Netlify environment variables
2. Ensure database server is running and accessible
3. Verify connection string format: postgresql://user:pass@host:5432/db?sslmode=require

### Pages Return 404 After Deployment

**Solution:**
In Netlify → Site Configuration → Build & deploy settings:
- Build command: 
pm run build
- Publish directory: .next/standalone
- Base directory: (empty)

Trigger new deployment.

### Email Notifications Not Working

**Solution:**
1. Verify SMTP credentials in environment variables
2. For Gmail, use app-specific password (not login password)
3. Test locally with 
pm run db:seed first

## Post-Deployment Tasks

### 1. Set Up Custom Domain (Optional)

In Netlify → Your site → Domain settings:
- Click "Add custom domain"
- Enter your domain (e.g., investpro.com)
- Follow DNS configuration instructions

### 2. Enable Branch Protection

GitHub → Repository → Settings → Branches:
- Protect main branch
- Require pull request reviews before merging
- Enable status checks

### 3. Configure GitHub Actions for CI/CD (Optional)

For automated testing and security scanning, create .github/workflows/ci.yml:

See the .github/workflows folder for example workflow files.

## Support Resources

- **Netlify Docs**: https://docs.netlify.com
- **Next.js Netlify Guide**: https://nextjs.org/docs/deployment/platforms/netlify
- **Netlify Community**: https://community.netlify.com
- **GitHub Actions Docs**: https://docs.github.com/actions

## Deployment Complete! 🎉

Your InvestPro platform is now:
- ✅ Deployed to GitHub
- ✅ Live on Netlify
- ✅ Configured with environment variables  
- ✅ Protected with security headers
- ✅ Ready for production use!

**Production URL:** https://your-app.netlify.app

Every push to GitHub's main branch will automatically deploy to Netlify! 🚀
