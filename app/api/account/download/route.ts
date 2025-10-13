import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user info from auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser || authUser.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userEmail = authUser.email || 'Not available';

    // Get user profile data (if exists)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // Get user's matches
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    // Get match partner names
    const matchPartnerIds = matches?.map(m =>
      m.user_id_1 === userId ? m.user_id_2 : m.user_id_1
    ) || [];

    let matchPartners: any[] = [];
    if (matchPartnerIds.length > 0) {
      const { data: partners } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', matchPartnerIds);
      matchPartners = partners || [];
    }

    // Get user's messages
    const matchIds = matches?.map(m => m.id) || [];
    let messages: any[] = [];
    if (matchIds.length > 0) {
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .in('match_id', matchIds)
        .order('sent_at', { ascending: true });
      messages = messagesData || [];
    }

    // Get user's likes sent
    const { data: sentLikes } = await supabase
      .from('likes')
      .select('*')
      .eq('from_user_id', userId);

    // Get user's likes received
    const { data: receivedLikes } = await supabase
      .from('likes')
      .select('*')
      .eq('to_user_id', userId);

    // Get names for liked users
    const likedUserIds = [
      ...(sentLikes?.map(l => l.to_user_id) || []),
      ...(receivedLikes?.map(l => l.from_user_id) || [])
    ];

    let likedUserNames: any[] = [];
    if (likedUserIds.length > 0) {
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', likedUserIds);
      likedUserNames = users || [];
    }

    // Get user settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Compile all data
    const userData = {
      export_date: new Date().toISOString(),
      export_version: '1.0',
      account: {
        user_id: userId,
        email: userEmail,
        created_at: authUser.created_at,
      },
      profile: profile ? {
        full_name: profile.full_name,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        bio: profile.bio,
        location_city: profile.location_city,
        interests: profile.interests || [],
        ethnicity: profile.ethnicity,
        height: profile.height,
        education: profile.education,
        occupation: profile.occupation,
        smoking: profile.smoking,
        drinking: profile.drinking,
        religion: profile.religion,
        relationship_type: profile.relationship_type,
        looking_for: profile.looking_for || [],
        languages: profile.languages || [],
        children: profile.children,
        has_pets: profile.has_pets,
        pet_preference: profile.pet_preference,
        favorite_books: profile.favorite_books || [],
        spotify_top_artists: profile.spotify_top_artists || [],
        is_premium: profile.is_premium || false,
        is_verified: profile.is_verified || false,
        created_at: profile.created_at,
        photos_count: profile.photos?.length || 0,
      } : {
        message: 'Profile not yet created'
      },
      matches: matches?.map(m => {
        const partnerId = m.user_id_1 === userId ? m.user_id_2 : m.user_id_1;
        const partner = matchPartners.find(p => p.id === partnerId);
        return {
          matched_at: m.matched_at,
          matched_with: partner?.full_name || 'Unknown User',
        };
      }) || [],
      messages: messages.map(m => ({
        content: m.content,
        sent_at: m.sent_at,
        is_sender: m.sender_id === userId,
        read_at: m.read_at,
      })),
      likes_sent: sentLikes?.map(l => {
        const user = likedUserNames.find(u => u.id === l.to_user_id);
        return {
          to_user: user?.full_name || 'Unknown',
          created_at: l.created_at,
          is_super_like: l.is_super_like,
        };
      }) || [],
      likes_received: receivedLikes?.map(l => {
        const user = likedUserNames.find(u => u.id === l.from_user_id);
        return {
          from_user: user?.full_name || 'Unknown',
          created_at: l.created_at,
          is_super_like: l.is_super_like,
        };
      }) || [],
      settings: settings || { message: 'No settings configured' },
      summary: {
        total_matches: matches?.length || 0,
        total_messages: messages.length,
        total_likes_sent: sentLikes?.length || 0,
        total_likes_received: receivedLikes?.length || 0,
      }
    };

    // Return as JSON file download
    const filename = `dating-app-data-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(userData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Data download error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
