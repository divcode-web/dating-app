/**
 * Notification Helper Functions
 * Sends email notifications for matches, likes, and messages via Resend API
 */

interface NotificationData {
  matchName?: string;
  matchPhoto?: string;
  matchBio?: string;
  likerName?: string;
  likerPhoto?: string;
  senderName?: string;
  senderPhoto?: string;
  messagePreview?: string;
}

export async function sendMatchNotification(userId: string, data: NotificationData) {
  try {
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'match',
        userId,
        data: {
          matchName: data.matchName,
          matchPhoto: data.matchPhoto,
          matchBio: data.matchBio,
        },
      }),
    });
  } catch (error) {
    console.error('Failed to send match notification:', error);
  }
}

export async function sendLikeNotification(userId: string, data: NotificationData) {
  try {
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'like',
        userId,
        data: {
          likerName: data.likerName,
          likerPhoto: data.likerPhoto,
        },
      }),
    });
  } catch (error) {
    console.error('Failed to send like notification:', error);
  }
}

export async function sendMessageNotification(userId: string, data: NotificationData) {
  try {
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'message',
        userId,
        data: {
          senderName: data.senderName,
          senderPhoto: data.senderPhoto,
          messagePreview: data.messagePreview,
        },
      }),
    });
  } catch (error) {
    console.error('Failed to send message notification:', error);
  }
}
