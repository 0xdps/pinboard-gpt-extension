# Vercel Deployment Guide

This guide explains how to deploy the GPT Pinboard website to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm i -g vercel`
3. **Node.js**: Ensure you have Node.js installed for the build process

## Files Added for Vercel

- `vercel.json` - Vercel configuration
- `.vercelignore` - Files to exclude from deployment
- New npm scripts in `package.json` for deployment

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy for the first time**:
   ```bash
   npm run deploy:preview  # Preview deployment
   # or
   npm run deploy          # Production deployment
   ```

4. **Follow the CLI prompts**:
   - Set up and deploy: `Y`
   - Which scope: Choose your account/team
   - Link to existing project: `N` (for first deployment)
   - What's your project's name: `gpt-pinboard` (or your preferred name)
   - In which directory is your code located: `./` (root)

### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the configuration from `vercel.json`

## Build Process

The deployment uses the following build process:

1. **Install dependencies**: `npm install`
2. **Generate assets**: `npm run build:assets` (creates icons from source PNGs)
3. **Copy website icons**: `npm run copy:website-icons` (copies icons to website/images/)
4. **Deploy**: Serves the `website/` directory as static files

## Environment Variables

No environment variables are required for this static website deployment.

## Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Navigate to "Settings" → "Domains"
3. Add your custom domain
4. Configure DNS records as instructed by Vercel

## Updating the Deployment

### For CLI deployments:
```bash
npm run deploy:preview  # Preview changes
npm run deploy          # Deploy to production
```

### For GitHub integration:
Simply push to your main branch - Vercel will automatically redeploy.

## Troubleshooting

### Build Issues
- Ensure all dependencies are in `package.json`
- Check that `npm run build:website` works locally
- Verify `website/` directory contains all necessary files

### Asset Issues
- Run `npm run build:assets` locally first
- Ensure source PNG files exist in `assets/` directory
- Check that icons are copied to `website/images/`

## Vercel Configuration Details

### vercel.json
```json
{
  "buildCommand": "npm run build:website",
  "outputDirectory": "website",
  "installCommand": "npm install",
  "devCommand": "npm run dev:website"
}
```

- **buildCommand**: Generates assets and copies icons
- **outputDirectory**: Serves the `website/` folder as static files
- **installCommand**: Installs Node.js dependencies for the build process
- **devCommand**: Local development server command

## Performance

The deployed website is optimized for performance:
- ✅ Static files served from Vercel's global CDN
- ✅ Automatic compression and caching
- ✅ Only website assets deployed (no extension code)
- ✅ SVG icons for crisp display at all sizes
- ✅ Optimized favicon variants for different devices