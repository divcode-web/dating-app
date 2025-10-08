import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the stored function to get match stories efficiently
    const { data: stories, error: storiesError } = await supabase
      .rpc('get_match_stories', { p_user_id: user.id });

    if (storiesError) {
      console.error('Error fetching stories:', storiesError);
      return NextResponse.json(
        { error: 'Failed to fetch stories' },
        { status: 500 }
      );
    }

    // Group stories by user
    const storiesByUser: Record<string, any[]> = {};

    stories?.forEach((story: any) => {
      if (!storiesByUser[story.user_id]) {
        storiesByUser[story.user_id] = [];
      }
      storiesByUser[story.user_id].push({
        id: story.story_id,
        user_id: story.user_id,
        media_url: story.media_url,
        media_type: story.media_type,
        thumbnail_url: story.thumbnail_url,
        caption: story.caption,
        duration: story.duration,
        created_at: story.created_at,
        expires_at: story.expires_at,
        is_viewed: story.is_viewed,
        view_count: story.view_count,
        user: {
          id: story.user_id,
          full_name: story.full_name,
          profile_photo: story.profile_photo,
        },
      });
    });

    // Convert to array and sort by most recent story
    const groupedStories = Object.values(storiesByUser).map((userStories) => {
      // Sort stories by created_at (newest first)
      userStories.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const hasUnviewed = userStories.some(s => !s.is_viewed);
      const latestStoryTime = userStories[0]?.created_at;

      return {
        user_id: userStories[0].user_id,
        user: userStories[0].user,
        stories: userStories,
        has_unviewed: hasUnviewed,
        latest_story_at: latestStoryTime,
      };
    });

    // Sort users by:
    // 1. Unviewed stories first
    // 2. Then by most recent story
    groupedStories.sort((a, b) => {
      if (a.has_unviewed && !b.has_unviewed) return -1;
      if (!a.has_unviewed && b.has_unviewed) return 1;
      return new Date(b.latest_story_at).getTime() - new Date(a.latest_story_at).getTime();
    });

    return NextResponse.json({
      success: true,
      stories: groupedStories,
    });
  } catch (error) {
    console.error('Error in stories/matches route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
