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

    // Get all matches for this user
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('user_id_1, user_id_2')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: 500 }
      );
    }

    // Get list of matched user IDs
    const matchedUserIds = matches?.map(match =>
      match.user_id_1 === user.id ? match.user_id_2 : match.user_id_1
    ) || [];

    if (matchedUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        stories: [],
      });
    }

    // Get stories from matched users
    const { data: storiesData, error: storiesError } = await supabase
      .from('stories')
      .select(`
        id,
        user_id,
        media_url,
        media_type,
        thumbnail_url,
        caption,
        duration,
        created_at,
        expires_at,
        user_profiles!user_id (
          id,
          full_name,
          photos
        )
      `)
      .in('user_id', matchedUserIds)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (storiesError) {
      console.error('Error fetching stories:', storiesError);
      return NextResponse.json(
        { error: 'Failed to fetch stories' },
        { status: 500 }
      );
    }

    // Get story views for current user
    const storyIds = storiesData?.map(s => s.id) || [];
    const { data: viewsData } = await supabase
      .from('story_views')
      .select('story_id')
      .eq('viewer_id', user.id)
      .in('story_id', storyIds);

    const viewedStoryIds = new Set(viewsData?.map(v => v.story_id) || []);

    // Get view counts for all stories
    const { data: viewCounts } = await supabase
      .from('story_views')
      .select('story_id')
      .in('story_id', storyIds);

    const viewCountMap = viewCounts?.reduce((acc, v) => {
      acc[v.story_id] = (acc[v.story_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Format stories with view info
    const stories = storiesData?.map((story: any) => ({
      story_id: story.id,
      user_id: story.user_id,
      full_name: story.user_profiles?.full_name || 'Unknown',
      profile_photo: story.user_profiles?.photos?.[0] || null,
      media_url: story.media_url,
      media_type: story.media_type,
      thumbnail_url: story.thumbnail_url,
      caption: story.caption,
      duration: story.duration,
      created_at: story.created_at,
      expires_at: story.expires_at,
      is_viewed: viewedStoryIds.has(story.id),
      view_count: viewCountMap[story.id] || 0,
    })) || [];

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

    const response = NextResponse.json({
      success: true,
      stories: groupedStories,
    });

    // Add cache headers for better performance
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');

    return response;
  } catch (error) {
    console.error('Error in stories/matches route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
