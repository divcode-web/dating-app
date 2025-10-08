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

    // 1. Check matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

    // 2. Check all active stories (bypass RLS with service key)
    const { data: allStories, error: allStoriesError } = await supabase
      .from('stories')
      .select('*, user_profiles!user_id(full_name)')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    // 3. Check stories from matches using the function
    const { data: matchStories, error: matchStoriesError } = await supabase
      .rpc('get_match_stories', { p_user_id: user.id });

    // 4. Check RLS by querying as the user (not service key)
    const userSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: rlsStories, error: rlsError } = await userSupabase
      .from('stories')
      .select('*')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    return NextResponse.json({
      success: true,
      debug: {
        current_user_id: user.id,
        current_user_email: user.email,
        matches: {
          count: matches?.length || 0,
          data: matches,
          error: matchesError?.message,
        },
        all_stories_count: allStories?.length || 0,
        all_stories: allStories,
        match_stories_from_function: {
          count: matchStories?.length || 0,
          data: matchStories,
          error: matchStoriesError?.message,
        },
        rls_filtered_stories: {
          count: rlsStories?.length || 0,
          data: rlsStories,
          error: rlsError?.message,
        }
      }
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
