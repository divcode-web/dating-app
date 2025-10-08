import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { userId, reason, category, feedback } = await request.json();

    if (!userId || !reason) {
      return NextResponse.json(
        { error: 'User ID and reason are required' },
        { status: 400 }
      );
    }

    // Use service role key to bypass RLS for deletion
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user data before deletion
    const { data: userData, error: fetchError } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Record deletion reason
    const { error: insertError } = await supabase
      .from('account_deletions')
      .insert({
        user_id: userId,
        email: userData.email || 'unknown',
        full_name: userData.full_name || 'Unknown',
        deletion_reason: reason,
        deletion_category: category || 'other',
        feedback: feedback || null,
      });

    if (insertError) {
      console.error('Error recording deletion reason:', insertError);
      // Continue with deletion even if recording fails
    }

    // Delete user from auth (this will cascade delete user_profiles due to foreign key)
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error('Error deleting user from auth:', deleteAuthError);
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
