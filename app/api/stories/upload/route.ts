import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
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

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string | null;
    const mediaType = formData.get('media_type') as 'image' | 'video';
    const duration = parseInt(formData.get('duration') as string) || 5;

    if (!file || !mediaType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, media_type' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Validate media type
    if (mediaType === 'image' && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid image file type' },
        { status: 400 }
      );
    }

    if (mediaType === 'video' && !file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Invalid video file type' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${timestamp}.${fileExt}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('stories')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('stories')
      .getPublicUrl(fileName);

    // For videos, we might want to generate a thumbnail
    // For now, we'll use the video itself as thumbnail
    const thumbnailUrl = mediaType === 'video' ? publicUrl : null;

    // Create story record in database
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data: story, error: dbError } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        media_url: publicUrl,
        media_type: mediaType,
        thumbnail_url: thumbnailUrl,
        caption: caption || null,
        duration: duration,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('stories').remove([fileName]);
      return NextResponse.json(
        { error: 'Failed to create story' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      story: story,
    });
  } catch (error) {
    console.error('Story upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
