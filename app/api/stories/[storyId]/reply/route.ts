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
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get story and verify it exists
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, user_id, media_url, caption, is_active, expires_at')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Don't allow replying to own stories
    if (story.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot reply to your own story' },
        { status: 400 }
      );
    }

    // Find the match between users
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id')
      .or(
        `and(user_id_1.eq.${user.id},user_id_2.eq.${story.user_id}),and(user_id_1.eq.${story.user_id},user_id_2.eq.${user.id})`
      )
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'You must be matched with this user to reply to their story' },
        { status: 403 }
      );
    }

    // Create message as a story reply
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        match_id: match.id,
        sender_id: user.id,
        receiver_id: story.user_id,
        content: message,
        story_id: storyId,
        story_reply_type: 'text',
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating story reply:', messageError);
      return NextResponse.json(
        { error: 'Failed to send reply' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: messageData,
    });
  } catch (error) {
    console.error('Error in story reply route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
