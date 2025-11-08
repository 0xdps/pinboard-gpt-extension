/**
 * Install endpoint - redirects users to appropriate browser store
 * Detects browser from User-Agent and redirects accordingly
 */

// Store URLs
const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/pingpt-%E2%80%94-chatgpt-message/hdhoaialemjelcfjjmjkkhkffiggbnap';
const FIREFOX_STORE_URL = 'https://addons.mozilla.org/en-US/firefox/addon/gpt-pinboard/';
const HOME_PAGE_URL = 'https://gptpins.dps.codes';

export default function handler(req, res) {
  // Get User-Agent header
  const userAgent = req.headers['user-agent'] || '';
  
  // Detect browser from User-Agent
  let redirectUrl = HOME_PAGE_URL; // Default fallback
  
  if (userAgent.includes('Firefox')) {
    // Firefox browser
    redirectUrl = FIREFOX_STORE_URL;
  } else if (userAgent.includes('Chrome') || userAgent.includes('Chromium')) {
    // Chrome or Chromium-based browsers (Edge, Brave, etc.)
    redirectUrl = CHROME_STORE_URL;
  } else if (userAgent.includes('Edg')) {
    // Microsoft Edge (uses Chrome store)
    redirectUrl = CHROME_STORE_URL;
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    // Safari (no extension available, send to home)
    redirectUrl = HOME_PAGE_URL;
  }
  
  // Log for debugging (optional)
  console.log('Install request:', {
    userAgent: userAgent.substring(0, 100),
    redirectUrl
  });
  
  // Perform redirect
  res.writeHead(302, {
    'Location': redirectUrl,
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end();
}
