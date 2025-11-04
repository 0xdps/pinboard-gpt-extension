// Vercel Function to handle feedback submissions via GitHub Issues
// Simplified version focused on GitHub Issues integration

// Helper function for verification status badge
function getVerificationBadge(status) {
  switch (status) {
    case 'verified': return '🟢 **VERIFIED** (Full extension confirmation - feedback enabled)';
    case 'likely': return '🟡 **LIKELY** (Extension indicators found - generic goodbye page)';
    case 'unknown': return '🟠 **UNKNOWN** (Uncertain status - redirected)';
    case 'none': return '🔴 **NONE** (No extension detected - redirected)';
    default: return '❓ **ERROR** (Verification failed - redirected)';
  }
}

export default async function handler(req, res) {
  // Set CORS headers (restrict to your domain in production)
  const allowedOrigins = [
    'https://gptpins.dps.codes',
    'https://gpt-pinboard-extension.vercel.app',
    'http://localhost:3000',
    'http://localhost:8080'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      reasons = [],
      rating,
      feedback = '',
      contact = false,
      timestamp,
      userAgent,
      url,
      extensionId,
      referrer,
      verification,
      website // honeypot field
    } = req.body;

    // Spam prevention: Rate limiting by IP
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const submissionKey = `feedback-${clientIP}`;
    
    // Simple in-memory rate limiting (resets on function restart)
    const now = Date.now();
    if (!global.submissions) global.submissions = new Map();
    
    const lastSubmission = global.submissions.get(submissionKey);
    const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes between submissions
    
    if (lastSubmission && (now - lastSubmission) < RATE_LIMIT_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastSubmission)) / 1000 / 60);
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: `Please wait ${waitTime} minutes before submitting feedback again.`,
        retryAfter: waitTime
      });
    }
    
    global.submissions.set(submissionKey, now);
    
    // Clean up old entries (keep only last hour)
    const oneHourAgo = now - (60 * 60 * 1000);
    for (const [key, time] of global.submissions.entries()) {
      if (time < oneHourAgo) {
        global.submissions.delete(key);
      }
    }

    // Validate required fields
    if (!reasons.length && !rating && !feedback.trim()) {
      return res.status(400).json({ error: 'At least one field is required' });
    }

    // Spam prevention: Content validation
    const feedbackText = feedback.trim();
    
    // Check for spam patterns
    const spamPatterns = [
      /(.)\1{10,}/i, // Repeated characters (more than 10)
      /https?:\/\/[^\s]+/gi, // URLs (suspicious in feedback)
      /(buy|sell|cheap|discount|offer|deal|money|cash|prize|winner|congratulations).{0,20}(now|today|click|link)/gi,
      /(\$\d+|\d+\$|USD|EUR|BTC|crypto)/gi, // Money references
      /(viagra|cialis|pharmacy|casino|lottery|gambling)/gi // Common spam keywords
    ];
    
    const suspiciousPatterns = spamPatterns.filter(pattern => pattern.test(feedbackText));
    
    if (suspiciousPatterns.length > 0) {
      console.log('🚨 Suspicious content detected:', { 
        ip: clientIP, 
        patterns: suspiciousPatterns.length,
        content: feedbackText.substring(0, 100) 
      });
      
      return res.status(400).json({
        error: 'Content validation failed',
        message: 'Your feedback contains content that appears to be spam. Please rewrite your message or contact support directly.'
      });
    }

    // Length validation
    if (feedbackText.length > 2000) {
      return res.status(400).json({
        error: 'Feedback too long',
        message: 'Please keep your feedback under 2000 characters.'
      });
    }

    // Validate referrer (should come from goodbye page)
    const expectedReferrers = [
      'https://gptpins.dps.codes/goodbye.html',
      'https://gpt-pinboard-extension.vercel.app/goodbye.html',
      'http://localhost:3000/goodbye.html',
      'http://localhost:8080/goodbye.html'
    ];
    
    const isValidReferrer = !referrer || expectedReferrers.some(expected => 
      referrer.startsWith(expected) || url?.includes('goodbye.html')
    );
    
    if (!isValidReferrer) {
      console.log('🚨 Invalid referrer:', { ip: clientIP, referrer, url });
      return res.status(403).json({
        error: 'Invalid request source',
        message: 'Feedback must be submitted from the official goodbye page.'
      });
    }

    // Honeypot field check - if filled, it's likely a bot
    if (website && website.trim() !== '') {
      console.log('🚨 Honeypot triggered:', { ip: clientIP, website });
      return res.status(400).json({
        error: 'Spam detected',
        message: 'Invalid form submission detected.'
      });
    }

    // Math CAPTCHA verification check
    const verificationAnswer = parseInt(verification);
    if (!verification || isNaN(verificationAnswer)) {
      return res.status(400).json({
        error: 'Verification required',
        message: 'Please complete the math verification.'
      });
    }

    // Basic validation - answer should be > 10 (since our sum is always > 10)
    // and reasonable range for single digit math problems (11-18: 2+9=11 to 9+9=18)
    if (verificationAnswer < 11 || verificationAnswer > 18) {
      console.log('🚨 Invalid math verification:', { ip: clientIP, answer: verificationAnswer });
      return res.status(400).json({
        error: 'Verification failed',
        message: 'Please solve the math problem correctly.'
      });
    }

    // Enhanced extension verification (optional but adds credibility)
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
        console.log('✅ Extension verified:', { 
          ip: clientIP, 
          extensionId: extensionId.extensionId,
          installDate: extensionId.installDate 
        });
      } else if (extensionId.confidence === 'medium') {
        extensionVerificationStatus = 'likely';
        console.log('⚠️ Extension likely (medium confidence):', { 
          ip: clientIP, 
          type: extensionId.type 
        });
      } else {
        extensionVerificationStatus = 'unknown';
        console.log('❓ Extension status unknown:', { 
          ip: clientIP, 
          type: extensionId.type || 'unknown' 
        });
      }
    } else {
      console.log('❌ No extension verification data:', { ip: clientIP });
    }

    // Only allow VERIFIED users to submit feedback
    if (extensionVerificationStatus !== 'verified') {
      console.log('🚨 Non-verified user attempting feedback submission:', { 
        ip: clientIP, 
        status: extensionVerificationStatus,
        type: extensionId?.type || 'none'
      });
      return res.status(403).json({
        error: 'Verification required',
        message: 'Only fully verified extension users can submit feedback through this form.',
        status: extensionVerificationStatus,
        alternatives: {
          github: 'https://github.com/0xdps/gpt-pinboard-extension/discussions/new?category=feedback',
          email: 'dps.manit@gmail.com'
        }
      });
    }

    // Prepare feedback data
    const feedbackData = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: timestamp || new Date().toISOString(),
      reasons: Array.isArray(reasons) ? reasons.slice(0, 9) : [], // Limit to valid reasons
      rating: rating ? Math.max(1, Math.min(5, parseInt(rating))) : null, // Clamp 1-5
      feedback: feedbackText,
      openToContact: contact === true,
      metadata: {
        userAgent: userAgent || 'Unknown',
        sourceUrl: url || 'Unknown',
        submissionMethod: 'web-form',
        clientIP: clientIP,
        referrer: referrer || 'Unknown',
        extensionVerification: extensionVerificationStatus,
        extensionData: extensionData,
        contentLength: feedbackText.length,
        hasExtensionContext: extensionVerificationStatus !== 'none'
      }
    };

    // Validate reasons are from allowed list
    const validReasons = [
      'too-complex', 'bugs', 'missing-features', 'performance', 
      'privacy-concerns', 'dont-use-chatgpt', 'found-alternative', 
      'temporary', 'other'
    ];
    
    feedbackData.reasons = feedbackData.reasons.filter(reason => 
      validReasons.includes(reason)
    );

    // Format reasons for better readability
    const formatReason = (reason) => {
      const reasonMap = {
        'too-complex': 'Too complex or hard to use',
        'bugs': 'Encountered bugs or technical issues',
        'missing-features': 'Missing features I needed',
        'performance': 'Performance issues (slow, laggy)',
        'privacy-concerns': 'Privacy or security concerns',
        'dont-use-chatgpt': "Don't use ChatGPT anymore",
        'found-alternative': 'Found a better alternative',
        'temporary': 'Temporary uninstall (testing, troubleshooting)',
        'other': 'Other reason'
      };
      return reasonMap[reason] || reason;
    };

    // Create rating display with emoji
    const getRatingDisplay = (rating) => {
      const ratingEmojis = { 1: '😞', 2: '😐', 3: '🙂', 4: '😊', 5: '🤩' };
      const ratingNames = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' };
      
      if (!rating) return 'Not provided';
      return `${rating}/5 ${ratingEmojis[rating]} (${ratingNames[rating]})`;
    };

    // Format for GitHub issue creation
    const githubIssueBody = `## 👋 Uninstall Feedback

**📅 Submitted:** ${new Date(feedbackData.timestamp).toLocaleString('en-US', { 
  timeZone: 'UTC',
  dateStyle: 'full',
  timeStyle: 'medium'
})}

### 🔍 Reasons for Uninstalling
${feedbackData.reasons.length > 0 
  ? feedbackData.reasons.map(reason => `- ${formatReason(reason)}`).join('\n')
  : '• Not specified'
}

### ⭐ Overall Experience Rating
${getRatingDisplay(feedbackData.rating)}

### 💬 Additional Feedback
${feedbackData.feedback ? `> ${feedbackData.feedback.replace(/\n/g, '\n> ')}` : '_No additional feedback provided_'}

### 📞 Contact Preferences
${feedbackData.openToContact ? '✅ Open to follow-up contact' : '❌ Prefers no follow-up contact'}

---

### 🔧 Technical Details

- **Feedback ID:** \`${feedbackData.id}\`
- **User Agent:** \`${feedbackData.metadata.userAgent}\`
- **Source URL:** ${feedbackData.metadata.sourceUrl}
- **Client IP:** \`${feedbackData.metadata.clientIP}\`
- **Referrer:** ${feedbackData.metadata.referrer}
- **Extension Verification:** ${getVerificationBadge(feedbackData.metadata.extensionVerification)}
- **Content Length:** ${feedbackData.metadata.contentLength} chars
- **Submission Method:** ${feedbackData.metadata.submissionMethod}
${feedbackData.metadata.extensionData ? `
- **Extension ID:** \`${feedbackData.metadata.extensionData.extensionId}\`
- **Install Token:** \`${feedbackData.metadata.extensionData.installToken}\`
- **Install Date:** ${feedbackData.metadata.extensionData.installDate}
- **Extension Version:** ${feedbackData.metadata.extensionData.version}` : ''}

---
*📝 Auto-generated from [goodbye page](https://gptpins.dps.codes/goodbye.html) feedback form*`;

    // Log feedback for debugging (always available)
    console.log('=== FEEDBACK SUBMISSION ===');
    console.log(JSON.stringify(feedbackData, null, 2));
    console.log('============================');

    // Check if GitHub token is configured
    if (!process.env.GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN not configured. Please add it to your environment variables.');
      return res.status(500).json({
        success: false,
        error: 'GitHub integration not configured',
        message: 'Please contact support - feedback logging is not properly set up.'
      });
    }

    // Create GitHub Issue
    try {
      const issueTitle = `${feedbackData.rating ? getRatingDisplay(feedbackData.rating) : 'Uninstall'} Feedback - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      
      const githubResponse = await fetch('https://api.github.com/repos/0xdps/gpt-pinboard-extension/issues', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'GPT-Pinboard-Feedback-Bot/1.0'
        },
        body: JSON.stringify({
          title: issueTitle,
          body: githubIssueBody,
          labels: ['feedback', 'uninstall', 'user-feedback', ...(feedbackData.rating ? [`rating-${feedbackData.rating}`] : [])]
        })
      });

      if (!githubResponse.ok) {
        const errorData = await githubResponse.json().catch(() => ({}));
        console.error('GitHub API Error:', githubResponse.status, errorData);
        
        throw new Error(`GitHub API returned ${githubResponse.status}: ${errorData.message || 'Unknown error'}`);
      }

      const issueData = await githubResponse.json();
      console.log(`✅ GitHub issue created: ${issueData.html_url}`);

      // Success response
      return res.status(200).json({
        success: true,
        message: 'Feedback submitted successfully!',
        id: feedbackData.id,
        githubIssue: {
          url: issueData.html_url,
          number: issueData.number
        },
        timestamp: feedbackData.timestamp
      });

    } catch (error) {
      console.error('Failed to create GitHub issue:', error);
      
      // Return error but still acknowledge the feedback was logged
      return res.status(500).json({
        success: false,
        error: 'GitHub integration failed',
        message: 'Your feedback was logged but could not create a GitHub issue. Please try the alternative feedback methods below.',
        details: error.message,
        fallbackOptions: {
          github: `https://github.com/0xdps/gpt-pinboard-extension/discussions/new?category=feedback`,
          email: `mailto:dps.manit@gmail.com?subject=GPT%20Pinboard%20Feedback&body=${encodeURIComponent(`Rating: ${feedbackData.rating || 'Not provided'}\nReasons: ${feedbackData.reasons.join(', ')}\nFeedback: ${feedbackData.feedback}`)}`
        }
      });
    }

  } catch (error) {
    console.error('Feedback processing error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process feedback submission',
      details: error.message
    });
  }
}