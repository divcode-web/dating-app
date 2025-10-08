import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { MatchNotificationEmail } from '@/emails/match-notification';
import { LikeNotificationEmail } from '@/emails/like-notification';
import { MessageNotificationEmail } from '@/emails/message-notification';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { type, userId, data } = await request.json();

    if (!type || !userId) {
      return NextResponse.json(
        { error: 'Type and userId are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user settings to check if notifications are enabled
    const { data: settings } = await supabase
      .from('user_settings')
      .select('email_notifications, notify_on_match, notify_on_like, notify_on_message')
      .eq('user_id', userId)
      .single();

    if (!settings?.email_notifications) {
      return NextResponse.json({
        message: 'Email notifications disabled for user',
      });
    }

    // Get user profile with email
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (!profile?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let emailData;

    switch (type) {
      case 'match':
        if (!settings.notify_on_match) {
          return NextResponse.json({ message: 'Match notifications disabled' });
        }

        emailData = await resend.emails.send({
          from: 'Dating App <notifications@yourdomain.com>',
          to: [profile.email],
          subject: `It's a Match with ${data.matchName}! 💕`,
          react: MatchNotificationEmail({
            userName: profile.full_name || 'there',
            matchName: data.matchName,
            matchPhoto: data.matchPhoto || `${appUrl}/default-avatar.png`,
            matchBio: data.matchBio || 'No bio yet',
            appUrl,
          }),
        });
        break;

      case 'like':
        if (!settings.notify_on_like) {
          return NextResponse.json({ message: 'Like notifications disabled' });
        }

        emailData = await resend.emails.send({
          from: 'Dating App <notifications@yourdomain.com>',
          to: [profile.email],
          subject: `${data.likerName} liked your profile! ❤️`,
          react: LikeNotificationEmail({
            userName: profile.full_name || 'there',
            likerName: data.likerName,
            likerPhoto: data.likerPhoto || `${appUrl}/default-avatar.png`,
            appUrl,
          }),
        });
        break;

      case 'message':
        if (!settings.notify_on_message) {
          return NextResponse.json({ message: 'Message notifications disabled' });
        }

        emailData = await resend.emails.send({
          from: 'Dating App <notifications@yourdomain.com>',
          to: [profile.email],
          subject: `New message from ${data.senderName}`,
          react: MessageNotificationEmail({
            userName: profile.full_name || 'there',
            senderName: data.senderName,
            senderPhoto: data.senderPhoto || `${appUrl}/default-avatar.png`,
            messagePreview: data.messagePreview.substring(0, 100),
            appUrl,
          }),
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: 'Notification sent successfully',
      emailId: emailData?.data?.id,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
