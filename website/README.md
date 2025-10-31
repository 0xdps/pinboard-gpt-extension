# GPT Pinboard Website

This directory contains the static website for GPT Pinboard extension.

## Structure

```
website/
├── index.html              # Main website page
├── sitemap.xml             # XML sitemap for search engines
├── sitemap.xsl             # XSL stylesheet for visual sitemap
├── sitemap.html            # Alternative HTML sitemap viewer
├── robots.txt              # Web crawler directives
├── favicon.ico             # Standard favicon file
├── test.html               # Development test page
├── README.md               # Website documentation
├── SEO-CHECKLIST.md        # SEO validation checklist
├── css/
│   └── styles.css          # All styles (responsive, modern design)
├── js/
│   └── main.js             # JavaScript functionality
└── images/
    ├── icon.svg            # Extension icon (SVG)
    ├── favicon-16x16.png   # 16x16 favicon
    ├── favicon-32x32.png   # 32x32 favicon
    ├── favicon-48x48.png   # 48x48 favicon (Apple touch)
    └── demo-screenshot.svg # Demo visualization
```

## Development

To run the website locally:

```bash
# Option 1: Using Python (recommended)
cd website
python3 -m http.server 8080

# Option 2: Using npm script (from project root)
npm run dev:website

# Option 3: Using Node.js (if you have http-server installed)
npx http-server website -p 8080
```

Then visit: http://localhost:8080

## Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern CSS** - Uses CSS Grid, Flexbox, and modern properties
- **Smooth Animations** - Scroll-triggered animations and smooth transitions
- **SEO Optimized** - Proper meta tags, semantic HTML, sitemap.xml, and robots.txt
- **Accessibility** - ARIA labels and keyboard navigation
- **Performance** - Optimized loading and minimal dependencies
- **Search Engine Ready** - Complete sitemap with visual XSL stylesheet

## Sections

1. **Hero** - Main value proposition and demo
2. **Features** - Key features with icons and descriptions
3. **How It Works** - Step-by-step usage guide
4. **Use Cases** - Target audiences and scenarios
5. **Installation** - Chrome Web Store and developer instructions
6. **Footer** - Links and additional information

## Customization

### Colors
Main color scheme defined in CSS custom properties:
- Primary: #10a37f (ChatGPT green)
- Secondary: #8b5cf6 (purple)
- Background: #f8fafc (light gray)
- Text: #1a1a1a (dark gray)

### Typography
Uses Inter font from Google Fonts for modern, readable text.

### Images
- Replace `images/demo-screenshot.svg` with actual screenshot
- Update `images/icon.svg` if logo changes
- Add more images in the images directory as needed

## Deployment

This is a static website that can be deployed to:
- GitHub Pages
- Netlify
- Vercel
- Any web server

Simply upload the contents of the `website/` directory to your hosting provider.

## SEO & Search Engine Optimization

The website includes comprehensive SEO features:

### Sitemap (`sitemap.xml`)
- **Purpose**: Helps search engines discover and index all pages
- **Features**: Includes priorities, change frequencies, and last modified dates
- **Visual**: Styled with `sitemap.xsl` for human-readable display
- **URLs**: Covers main site sections and GitHub documentation

### Robots.txt (`robots.txt`)
- **Purpose**: Provides crawling instructions to search engines
- **Features**: 
  - Allows all major search engine bots (Google, Bing, DuckDuck, etc.)
  - Prevents crawling of unnecessary paths (admin, private, etc.)
  - Optimized crawl delays for better server performance
  - Social media bot support for rich previews

### Favicon & Icons
- **Multiple formats**: SVG (modern), PNG (fallback), ICO (legacy)
- **Responsive sizes**: 16x16, 32x32, 48x48 for different contexts
- **Apple touch icon**: 48x48 PNG for iOS home screen
- **Cross-browser support**: Works on all major browsers

### Meta Tags & SEO
- Open Graph tags for social media sharing
- Proper title and description tags
- Semantic HTML structure
- Schema.org markup potential

### Testing SEO Files
```bash
# Start development server
npm run dev:website

# View sitemaps
open http://localhost:8080/sitemap.xml      # XML sitemap (may need XSL support)
open http://localhost:8080/sitemap.html     # HTML sitemap viewer (always works)

# Check other SEO files
open http://localhost:8080/robots.txt       # Crawler directives
open http://localhost:8080/test.html        # Development test page

# Validate sitemap (when deployed)
curl -s "https://www.google.com/ping?sitemap=https://gpt-pinboard.com/sitemap.xml"
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

### Website Features
- [ ] Dark mode toggle
- [ ] Interactive demo
- [ ] Blog section
- [ ] User testimonials
- [ ] Analytics integration
- [ ] Contact form
- [ ] PWA features

### SEO Enhancements
- [ ] Schema.org structured data markup
- [ ] Image sitemap for better image indexing
- [ ] News sitemap (if adding blog)
- [ ] Multilingual support with hreflang tags
- [ ] Performance optimization for Core Web Vitals
- [ ] Rich snippets for better search results