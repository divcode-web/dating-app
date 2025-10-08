import { NextRequest, NextResponse } from 'next/server';
import {
  sendDeletionConfirmation,
  sendMatchNotification,
  sendMessageNotification,
  sendAccountSuspendedNotification,
} from '@/lib/email-service';

export async function POST(request: NextRequest) {
  // COMMENTED OUT FOR DEBUGGING - Email service disabled
  return NextResponse.json(
    { success: true, message: 'Email service temporarily disabled' },
    { status: 200 }
  );

  /* try {
    const { type, email, ...rest } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    let success = false;

    switch (type) {
      case 'deletion':
        success = await sendDeletionConfirmation(email, rest.reason);
        break;

      case 'match':
        if (!rest.matchName) {
          return NextResponse.json(
            { error: 'matchName is required for match notifications' },
            { status: 400 }
          );
        }
        success = await sendMatchNotification(email, rest.matchName);
        break;

      case 'message':
        if (!rest.senderName || !rest.messagePreview) {
          return NextResponse.json(
            { error: 'senderName and messagePreview are required for message notifications' },
            { status: 400 }
          );
        }
        success = await sendMessageNotification(email, rest.senderName, rest.messagePreview);
        break;

      case 'suspended':
        if (!rest.reason) {
          return NextResponse.json(
            { error: 'reason is required for suspension notifications' },
            { status: 400 }
          );
        }
        success = await sendAccountSuspendedNotification(
          email,
          rest.reason,
          rest.suspendedUntil ? new Date(rest.suspendedUntil) : undefined
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Send email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } */
}
