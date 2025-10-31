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

The deployment uses an optimized build process:

### Smart Build Detection
Vercel only rebuilds when changes are detected in:
- `assets/` - Source PNG files and asset generation
- `website/` - Website source code (HTML, CSS, JS)
- `scripts/` - Build scripts and asset generation
- `package.json` - Dependencies and build configuration
- `vercel.json` - Deployment configuration

**This means:**
- ✅ Updating extension code (`extension/`) won't trigger unnecessary rebuilds
- ✅ Documentation changes (`.md` files) won't trigger rebuilds
- ✅ Main/trunk branch deployments always build (production safety)
- ✅ Commit messages with "trigger build" always build (force override)
- ✅ Faster deployments for unrelated changes

### Build Steps
1. **Check for relevant changes**: `scripts/vercel-ignore-build.sh`
2. **Install dependencies**: `npm install`
3. **Generate assets**: `npm run build:assets` (creates icons from source PNGs)
4. **Copy website icons**: `npm run copy:website-icons` (copies icons to website/images/)
5. **Deploy**: Serves the `website/` directory as static files

## Build Triggers

The smart build system will trigger a build in these cases:

### ✅ Always Build
- **Main/Production branches**: `main` or `trunk` branches always build
- **Initial commits**: First commit in repository always builds
- **Force trigger**: Commit message contains "trigger build" (case insensitive)

### ✅ File Changes Build
- Changes in `assets/` directory (source PNG files)
- Changes in `website/` directory (HTML, CSS, JS, images)
- Changes in `scripts/` directory (build scripts)
- Changes to `package.json` (dependencies, scripts)
- Changes to `vercel.json` (deployment config)

### ⏭️ Skip Build  
- Changes only in `extension/` directory (Chrome extension code)
- Documentation updates (`.md` files, `LICENSE`, etc.)
- Configuration files (`.gitignore`, `.vercelignore`)
- Any other unrelated files

### 🔧 Force Build Examples
```bash
# These commits will trigger builds even if no relevant files changed:
git commit -m "Update extension docs [trigger build]"
git commit -m "TRIGGER BUILD - testing deployment" 
git commit -m "Minor fixes, trigger build needed"
```

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
- **"Cannot find module 'scripts/generate-assets.js'"**: Ensure `scripts/` directory is not excluded in `.vercelignore`
- Ensure all dependencies are in `package.json`
- Check that `npm run build:website` works locally
- Verify `website/` directory contains all necessary files

### Asset Issues
- **Missing source assets**: Ensure `assets/` directory contains source PNG files
- Run `npm run build:assets` locally first to test
- Check that icons are copied to `website/images/`
- Verify `.vercelignore` allows `scripts/` and `assets/` directories for build

### Build Skipping Issues
- **Build unexpectedly skipped**: Check if changes are only in excluded directories (like `extension/`, `*.md` files)
- **Force build options**:
  - Push changes to `main` or `trunk` branch (always builds)
  - Include "trigger build" in commit message (case insensitive)
  - Example: `git commit -m "Update docs [trigger build]"`
- **Test ignore script**: Run `bash scripts/vercel-ignore-build.sh` locally to test logic

### Caching Issues
- **Changes not showing**: Hard refresh browser (Ctrl+F5 / Cmd+Shift+R) to bypass cache
- **Test cache headers**: Use browser dev tools Network tab to verify cache headers
- **Assets not updating**: Check if files are properly copied to `website/images/`

## Vercel Configuration Details

### vercel.json
```json
{
  "buildCommand": "npm run build:website",
  "outputDirectory": "website",
  "installCommand": "npm install",
  "devCommand": "npm run dev:website",
  "ignoreCommand": "bash scripts/vercel-ignore-build.sh"
}
```

- **buildCommand**: Generates assets and copies icons
- **outputDirectory**: Serves the `website/` folder as static files
- **installCommand**: Installs Node.js dependencies for the build process
- **devCommand**: Local development server command
- **ignoreCommand**: Smart build detection - only builds when website-related files change
- **headers**: Optimized caching and security headers for different file types

## Performance

The deployed website is optimized for performance:
- ✅ **Smart builds**: Only rebuilds when website-related files change
- ✅ **Fast deployments**: Skips unnecessary builds for extension/documentation changes
- ✅ Static files served from Vercel's global CDN
- ✅ **Optimized caching headers** for different file types
- ✅ **Security headers** for enhanced protection
- ✅ Only website assets deployed (no extension code)
- ✅ SVG icons for crisp display at all sizes
- ✅ Optimized favicon variants for different devices

### Caching Strategy

The deployment uses optimized cache headers for maximum performance:

| File Type | Cache Duration | Strategy |
|-----------|----------------|----------|
| **Static Assets** (`/images/`, `/css/`, `/js/`) | 1 year | `immutable` - Perfect for versioned assets |
| **Icons & Favicons** | 1 year | `immutable` - Icons rarely change |
| **SEO Files** (`robots.txt`, `sitemap.xml`) | 1 day | Regular refresh for search engines |
| **HTML** (`index.html`) | No cache | `must-revalidate` - Always fresh content |

### Security Headers

All pages include security headers:
- **X-Content-Type-Options**: Prevents MIME-type sniffing attacks
- **X-Frame-Options**: Prevents clickjacking (iframe embedding)
- **X-XSS-Protection**: Enables browser XSS filtering
- **Referrer-Policy**: Controls referrer information sharing