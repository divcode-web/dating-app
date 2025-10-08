/**
 * AI Content Moderation using OpenAI Moderation API
 *
 * OpenAI Moderation API is 100% FREE with no rate limits
 * Perfect for startups - detects:
 * - Sexual content
 * - Hate speech
 * - Harassment
 * - Self-harm
 * - Violence
 * - And more...
 */

export interface ModerationResult {
  flagged: boolean;
  categories: {
    sexual: boolean;
    hate: boolean;
    harassment: boolean;
    'self-harm': boolean;
    'sexual/minors': boolean;
    'hate/threatening': boolean;
    'violence/graphic': boolean;
    'self-harm/intent': boolean;
    'self-harm/instructions': boolean;
    'harassment/threatening': boolean;
    violence: boolean;
  };
  category_scores: {
    sexual: number;
    hate: number;
    harassment: number;
    'self-harm': number;
    'sexual/minors': number;
    'hate/threatening': number;
    'violence/graphic': number;
    'self-harm/intent': number;
    'self-harm/instructions': number;
    'harassment/threatening': number;
    violence: number;
  };
  reason?: string;
}

/**
 * Check content using OpenAI Moderation API
 * Completely FREE - no charges for API calls
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('OpenAI API key not configured - skipping moderation');
    return {
      flagged: false,
      categories: {
        sexual: false,
        hate: false,
        harassment: false,
        'self-harm': false,
        'sexual/minors': false,
        'hate/threatening': false,
        'violence/graphic': false,
        'self-harm/intent': false,
        'self-harm/instructions': false,
        'harassment/threatening': false,
        violence: false,
      },
      category_scores: {
        sexual: 0,
        hate: 0,
        harassment: 0,
        'self-harm': 0,
        'sexual/minors': 0,
        'hate/threatening': 0,
        'violence/graphic': 0,
        'self-harm/intent': 0,
        'self-harm/instructions': 0,
        'harassment/threatening': 0,
        violence: 0,
      },
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.results[0];

    // Add human-readable reason if flagged
    if (result.flagged) {
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category);

      result.reason = `Content flagged for: ${flaggedCategories.join(', ')}`;
    }

    return result;
  } catch (error) {
    console.error('Moderation API error:', error);
    // Fail open - don't block content if API fails
    return {
      flagged: false,
      categories: {
        sexual: false,
        hate: false,
        harassment: false,
        'self-harm': false,
        'sexual/minors': false,
        'hate/threatening': false,
        'violence/graphic': false,
        'self-harm/intent': false,
        'self-harm/instructions': false,
        'harassment/threatening': false,
        violence: false,
      },
      category_scores: {
        sexual: 0,
        hate: 0,
        harassment: 0,
        'self-harm': 0,
        'sexual/minors': 0,
        'hate/threatening': 0,
        'violence/graphic': 0,
        'self-harm/intent': 0,
        'self-harm/instructions': 0,
        'harassment/threatening': 0,
        violence: 0,
      },
    };
  }
}

/**
 * Moderate profile bio before saving
 */
export async function moderateProfileBio(bio: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!bio || bio.trim().length === 0) {
    return { allowed: true };
  }

  const result = await moderateContent(bio);

  return {
    allowed: !result.flagged,
    reason: result.reason,
  };
}

/**
 * Moderate message before sending
 */
export async function moderateMessage(message: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!message || message.trim().length === 0) {
    return { allowed: true };
  }

  const result = await moderateContent(message);

  return {
    allowed: !result.flagged,
    reason: result.reason,
  };
}

/**
 * Get detailed moderation results for admin review
 */
export async function getDetailedModeration(text: string): Promise<ModerationResult> {
  return moderateContent(text);
}
