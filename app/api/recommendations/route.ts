import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTopRecommendations, explainRecommendation } from '@/lib/ai-recommendations';
import { sanitizeUUID, sanitizeNumber } from '@/lib/sanitize';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = sanitizeUUID(searchParams.get('userId') || '');
    const limit = sanitizeNumber(searchParams.get('limit') || '10', 1, 50) || 10;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid User ID' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get candidates (exclude already liked users)
    const { data: likes } = await supabase
      .from('likes')
      .select('to_user_id')
      .eq('from_user_id', userId);

    const likedIds = likes?.map(l => l.to_user_id) || [];

    let query = supabase
      .from('user_profiles')
      .select('*')
      .neq('id', userId);

    // Apply gender filter from settings
    if (settings?.show_me_gender?.length > 0) {
      query = query.in('gender', settings.show_me_gender);
    }

    // Exclude already liked
    if (likedIds.length > 0) {
      query = query.not('id', 'in', `(${likedIds.join(',')})`);
    }

    const { data: candidates, error: candidatesError } = await query.limit(100);

    if (candidatesError) {
      throw candidatesError;
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        recommendations: [],
        message: 'No more profiles available',
      });
    }

    // Calculate AI recommendations
    const recommendations = getTopRecommendations(user, candidates, limit, {
      max_distance: settings?.distance_range || 100,
    });

    // Format response with explanations
    const formattedRecommendations = recommendations.map(rec => ({
      userId: rec.userId,
      score: rec.score,
      matchPercentage: Math.round(rec.score * 100),
      reasons: rec.reasons,
      explanation: explainRecommendation(rec),
      breakdown: rec.breakdown,
    }));

    return NextResponse.json({
      recommendations: formattedRecommendations,
      total: formattedRecommendations.length,
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
