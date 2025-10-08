import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET a specific story (with view details)
export async function GET(
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

    // Fetch story with user profile
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(`
        *,
        user:user_profiles!user_id (
          id,
          full_name,
          photos
        )
      `)
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // If user is viewing their own story, get view details
    if (story.user_id === user.id) {
      const { data: views } = await supabase
        .from('story_views')
        .select(`
          *,
          viewer:user_profiles!viewer_id (
            id,
            full_name,
            photos
          )
        `)
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false });

      return NextResponse.json({
        success: true,
        story: {
          ...story,
          viewers: views || [],
          view_count: views?.length || 0,
        },
      });
    }

    // Check if story is active
    if (!story.is_active || new Date(story.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Story is no longer available' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      story,
    });
  } catch (error) {
    console.error('Error in story GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE a story
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

    // Get story to verify ownership and get media URL
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, user_id, media_url')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (story.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own stories' },
        { status: 403 }
      );
    }

    // Extract file path from URL
    const urlParts = story.media_url.split('/stories/');
    const filePath = urlParts[1];

    // Delete from database (this will cascade delete story_views)
    const { error: deleteError } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);

    if (deleteError) {
      console.error('Error deleting story from database:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete story' },
        { status: 500 }
      );
    }

    // Delete from storage
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from('stories')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting story from storage:', storageError);
        // Story is already deleted from DB, so just log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Story deleted successfully',
    });
  } catch (error) {
    console.error('Error in story DELETE route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
