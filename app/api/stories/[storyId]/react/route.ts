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
    const body = await request.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }

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

    // Don't allow reacting to own stories
    if (story.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot react to your own story' },
        { status: 400 }
      );
    }

    // Check if story is still active
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
        { error: 'You must be matched with this user to react to their story' },
        { status: 403 }
      );
    }

    // Upsert reaction (will update if exists, insert if not)
    const { data: reaction, error: reactionError } = await supabase
      .from('story_reactions')
      .upsert({
        story_id: storyId,
        user_id: user.id,
        emoji: emoji,
      }, {
        onConflict: 'story_id,user_id'
      })
      .select()
      .single();

    if (reactionError) {
      console.error('Error creating reaction:', reactionError);
      return NextResponse.json(
        { error: 'Failed to add reaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reaction: reaction,
    });
  } catch (error) {
    console.error('Error in story react route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a reaction
export async function DELETE(
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

    // Delete the reaction
    const { error: deleteError } = await supabase
      .from('story_reactions')
      .delete()
      .eq('story_id', storyId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting reaction:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove reaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reaction removed',
    });
  } catch (error) {
    console.error('Error in delete reaction route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
