import { Hono } from 'hono';

const app = new Hono();

// Store URLs
const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/pingpt-%E2%80%94-chatgpt-message/hdhoaialemjelcfjjmjkkhkffiggbnap';
const FIREFOX_STORE_URL = 'https://addons.mozilla.org/en-US/firefox/addon/gpt-pinboard/';
const HOME_PAGE_URL = 'https://pinboard-gpt.dps.codes';

// Install endpoint - redirects to appropriate store
app.get('/', (c) => {
  const userAgent = c.req.header('user-agent') || '';
  
  let redirectUrl = HOME_PAGE_URL;
  
  if (userAgent.includes('Firefox')) {
    redirectUrl = FIREFOX_STORE_URL;
  } else if (userAgent.includes('Chrome') || userAgent.includes('Chromium') || userAgent.includes('Edg')) {
    redirectUrl = CHROME_STORE_URL;
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    redirectUrl = HOME_PAGE_URL;
  }
  
  console.log('Install redirect:', {
    userAgent: userAgent.substring(0, 100),
    redirectUrl
  });
  
  return c.redirect(redirectUrl, 302);
});

export default app;
