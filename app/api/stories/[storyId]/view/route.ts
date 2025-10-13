import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';export const runtime = 'nodejs';
export async function POST(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
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

    const { storyId } = params;

    // Check if story exists and is active
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, user_id, is_active, expires_at')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Don't allow viewing own stories (or optionally allow for testing)
    if (story.user_id === user.id) {
      return NextResponse.json({
        success: true,
        message: 'Cannot view own story',
      });
    }

    // Check if story is still active and not expired
    if (!story.is_active || new Date(story.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Story is no longer available' },
        { status: 410 }
      );
    }

    // Verify that the viewer is matched with the story owner
    const { data: match } = await supabase
      .from('matches')
      .select('id')
      .or(
        `and(user_id_1.eq.${user.id},user_id_2.eq.${story.user_id}),and(user_id_1.eq.${story.user_id},user_id_2.eq.${user.id})`
      )
      .single();

    if (!match) {
      return NextResponse.json(
        { error: 'You must be matched with this user to view their story' },
        { status: 403 }
      );
    }

    // Insert story view (will be ignored if already exists due to UNIQUE constraint)
    const { error: viewError } = await supabase
      .from('story_views')
      .insert({
        story_id: storyId,
        viewer_id: user.id,
      });

    // Ignore duplicate key errors (user already viewed this story)
    if (viewError && !viewError.message.includes('duplicate key')) {
      console.error('Error creating story view:', viewError);
      return NextResponse.json(
        { error: 'Failed to record story view' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Story view recorded',
    });
  } catch (error) {
    console.error('Error in story view route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
