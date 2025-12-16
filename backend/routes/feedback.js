import { Hono } from 'hono';
import { desc, and, gte, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { feedback } from '../db/schema.js';

const app = new Hono();

const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

// Check rate limit using database
async function checkRateLimit(clientIP) {
  const fiveMinutesAgo = Math.floor((Date.now() - RATE_LIMIT_MS) / 1000);
  
  const recentSubmissions = await db.select()
    .from(feedback)
    .where(and(
      sql`${feedback.clientIp} = ${clientIP}`,
      gte(feedback.createdAt, new Date(fiveMinutesAgo * 1000))
    ))
    .limit(1);
  
  return recentSubmissions.length > 0;
}

// Helper function for verification status badge
function getVerificationBadge(status) {
  switch (status) {
    case 'verified': return '🟢 VERIFIED';
    case 'likely': return '🟡 LIKELY';
    case 'unknown': return '🟠 UNKNOWN';
    case 'none': return '🔴 NONE';
    default: return '❓ ERROR';
  }
}

// Submit feedback
app.post('/', async (c) => {
  try {
    const {
      reasons = [],
      rating,
      feedback: feedbackText = '',
      contact = false,
      timestamp,
      userAgent,
      url,
      extensionId,
      referrer,
      verification,
      website // honeypot field
    } = await c.req.json();

    // Get client IP
    const clientIP = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    
    // Rate limiting using database (serverless-friendly)
    const isRateLimited = await checkRateLimit(clientIP);
    
    if (isRateLimited) {
      const waitTime = Math.ceil(RATE_LIMIT_MS / 1000 / 60);
      return c.json({ 
        error: 'Rate limit exceeded',
        message: `Please wait ${waitTime} minutes before submitting feedback again.`,
        retryAfter: waitTime
      });
    }

    // Validate required fields
    if (!reasons.length && !rating && !feedbackText.trim()) {
      return c.json({ error: 'At least one field is required' });
    }

    // Honeypot check
    if (website && website.trim() !== '') {
      console.log('🚨 Honeypot triggered:', { ip: clientIP, website });
      return c.json({ error: 'Spam detected' });
    }

    // Spam detection
    const spamPatterns = [
      /(.)\1{10,}/i,
      /https?:\/\/[^\s]+/gi,
      /(buy|sell|cheap|discount|offer|deal|money|cash|prize|winner|congratulations).{0,20}(now|today|click|link)/gi,
      /(\$\d+|\d+\$|USD|EUR|BTC|crypto)/gi,
      /(viagra|cialis|pharmacy|casino|lottery|gambling)/gi
    ];
    
    const hasSpam = spamPatterns.some(pattern => pattern.test(feedbackText));
    if (hasSpam) {
      console.log('🚨 Suspicious content detected:', { ip: clientIP });
      return c.json({
        error: 'Content validation failed',
        message: 'Your feedback contains suspicious content.'
      });
    }

    // Length validation
    if (feedbackText.length > 2000) {
      return c.json({
        error: 'Feedback too long',
        message: 'Please keep your feedback under 2000 characters.'
      });
    }

    // Validate referrer
    const expectedReferrers = [
      'https://pinboardgpt.app/goodbye.html',
      'http://localhost:8080/goodbye.html'
    ];
    
    const isValidReferrer = !referrer || expectedReferrers.some(expected => 
      referrer.startsWith(expected) || url?.includes('goodbye.html')
    );
    
    if (!isValidReferrer) {
      console.log('🚨 Invalid referrer:', { ip: clientIP, referrer });
      return c.json({
        error: 'Invalid request source'
      });
    }

    // Math CAPTCHA verification
    const verificationAnswer = parseInt(verification);
    if (!verification || isNaN(verificationAnswer) || verificationAnswer < 11 || verificationAnswer > 18) {
      console.log('🚨 Invalid math verification:', { ip: clientIP, answer: verificationAnswer });
      return c.json({
        error: 'Verification failed',
        message: 'Please solve the math problem correctly.'
      });
    }

    // Extension verification
    let extensionVerificationStatus = 'none';
    let extensionData = null;

    if (extensionId && typeof extensionId === 'object') {
      if (extensionId.type === 'verified-extension' && extensionId.installToken) {
        extensionVerificationStatus = 'verified';
        extensionData = {
          extensionId: extensionId.extensionId,
          installToken: extensionId.installToken,
          installDate: extensionId.installDate,
          version: extensionId.version
        };
      } else if (extensionId.confidence === 'medium') {
        extensionVerificationStatus = 'likely';
      } else {
        extensionVerificationStatus = 'unknown';
      }
    }

    // Only allow VERIFIED users
    if (extensionVerificationStatus !== 'verified') {
      console.log('🚨 Non-verified user:', { ip: clientIP, status: extensionVerificationStatus });
      return c.json({
        error: 'Verification required',
        message: 'Only verified extension users can submit feedback.',
        status: extensionVerificationStatus
      });
    }

    // Validate reasons
    const validReasons = [
      'too-complex', 'bugs', 'missing-features', 'performance', 
      'privacy-concerns', 'dont-use-chatgpt', 'found-alternative', 
      'temporary', 'other'
    ];
    
    const filteredReasons = Array.isArray(reasons) 
      ? reasons.filter(r => validReasons.includes(r)).slice(0, 9)
      : [];

    // Generate feedback ID
    const feedbackId = `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Save to database
    await db.insert(feedback).values({
      feedbackId,
      reasons: JSON.stringify(filteredReasons),
      rating: rating ? Math.max(1, Math.min(5, parseInt(rating))) : null,
      feedback: feedbackText.trim(),
      openToContact: contact === true,
      userAgent: userAgent || 'Unknown',
      sourceUrl: url || 'Unknown',
      clientIp: clientIP,
      referrer: referrer || 'Unknown',
      extensionVerification: extensionVerificationStatus,
      extensionData: extensionData ? JSON.stringify(extensionData) : null,
    });

    console.log('✅ Feedback saved:', { id: feedbackId, ip: clientIP, rating });

    // Success response
    return c.json({
      success: true,
      message: 'Feedback submitted successfully!',
      id: feedbackId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Feedback processing error:', error);
    
    return c.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process feedback submission'
    });
  }
});

// Get all feedback (admin endpoint - should be protected)
app.get('/', async (c) => {
  try {
    const allFeedback = await db.select().from(feedback).orderBy(desc(feedback.createdAt));
    
    const formatted = allFeedback.map(f => ({
      id: f.feedbackId,
      reasons: JSON.parse(f.reasons || '[]'),
      rating: f.rating,
      feedback: f.feedback,
      openToContact: f.openToContact,
      extensionVerification: f.extensionVerification,
      createdAt: f.createdAt,
    }));
    
    return c.json({
      success: true,
      count: formatted.length,
      feedback: formatted
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return c.json({ error: 'Failed to fetch feedback' }, 500);
  }
});

export default app;
