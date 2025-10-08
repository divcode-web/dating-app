import { NextRequest, NextResponse } from 'next/server';
import { moderateContent, moderateProfileBio, moderateMessage } from '@/lib/ai-moderation';
import { sanitizeString } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = sanitizeString(body.text);
    const type = sanitizeString(body.type);

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'bio':
        result = await moderateProfileBio(text);
        break;
      case 'message':
        result = await moderateMessage(text);
        break;
      default:
        const moderation = await moderateContent(text);
        result = {
          allowed: !moderation.flagged,
          reason: moderation.reason,
          details: moderation,
        };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Moderation API error:', error);
    return NextResponse.json(
      { error: 'Moderation failed', allowed: true }, // Fail open
      { status: 500 }
    );
  }
}
