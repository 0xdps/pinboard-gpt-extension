# Vercel Configuration Test

This file documents the caching and security headers configuration for the Vercel deployment.

## Header Configuration Summary

### Security Headers (Applied to all routes `(.*)`)
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents iframe embedding (clickjacking protection)
- `X-XSS-Protection: 1; mode=block` - Enables XSS filtering
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information

### Cache Headers by File Type

#### Long-term Cache (1 year, immutable)
- `/images/*` - All images (PNG, SVG, ICO)
- `/css/*` - All stylesheets
- `/js/*` - All JavaScript files
- Root icons: `favicon.ico`, `favicon-*.png`, `icon.svg`

#### Short-term Cache (1 day)
- `robots.txt` - Search engine instructions
- `sitemap.xml` - Site structure for crawlers
- `sitemap.xsl` - Sitemap styling

#### No Cache (Always fresh)
- `index.html` - Main page content

## Testing Cache Headers

You can test the headers using curl:

```bash
# Test main page (should have no cache)
curl -I https://your-domain.vercel.app/

# Test CSS file (should have 1 year cache)
curl -I https://your-domain.vercel.app/css/styles.css

# Test image (should have 1 year cache)
curl -I https://your-domain.vercel.app/images/icon.svg
```

## Expected Behavior

1. **First Visit**: All files downloaded and cached appropriately
2. **Return Visit**: Static assets served from cache, HTML always fresh
3. **After Deployment**: HTML updates immediately, static assets update only if changed
4. **Security**: All responses include security headers for protection