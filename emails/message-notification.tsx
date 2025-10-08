import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface MessageNotificationEmailProps {
  userName: string;
  senderName: string;
  senderPhoto: string;
  messagePreview: string;
  appUrl: string;
}

export function MessageNotificationEmail({
  userName,
  senderName,
  senderPhoto,
  messagePreview,
  appUrl,
}: MessageNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New message from {senderName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Message! 💬</Heading>

          <Text style={text}>
            Hi {userName},
          </Text>

          <Text style={text}>
            You received a new message from <strong>{senderName}</strong>:
          </Text>

          <Section style={imageSection}>
            <Img
              src={senderPhoto}
              alt={senderName}
              width="80"
              height="80"
              style={profileImage}
            />
          </Section>

          <Section style={messageBox}>
            <Text style={messageText}>"{messagePreview}"</Text>
          </Section>

          <Section style={buttonSection}>
            <Link href={`${appUrl}/messages`} style={button}>
              Reply Now
            </Link>
          </Section>

          <Text style={footer}>
            You received this email because you enabled message notifications in your settings.
            <br />
            <Link href={`${appUrl}/settings`} style={link}>
              Manage notification preferences
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default MessageNotificationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
};

const h1 = {
  color: '#333',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
};

const imageSection = {
  textAlign: 'center' as const,
  padding: '20px 0',
};

const profileImage = {
  borderRadius: '50%',
  objectFit: 'cover' as const,
  border: '3px solid #f472b6',
};

const messageBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 40px',
};

const messageText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '22px',
  fontStyle: 'italic',
  margin: '0',
};

const buttonSection = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
};

const button = {
  backgroundColor: '#ec4899',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '32px',
  textAlign: 'center' as const,
};

const link = {
  color: '#ec4899',
  textDecoration: 'underline',
};
