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

interface LikeNotificationEmailProps {
  userName: string;
  likerName: string;
  likerPhoto: string;
  appUrl: string;
}

export function LikeNotificationEmail({
  userName,
  likerName,
  likerPhoto,
  appUrl,
}: LikeNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{likerName} liked your profile! ❤️</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Someone Likes You! ❤️</Heading>

          <Text style={text}>
            Hi {userName},
          </Text>

          <Text style={text}>
            <strong>{likerName}</strong> just liked your profile. Check them out and like back if you're interested!
          </Text>

          <Section style={imageSection}>
            <Img
              src={likerPhoto}
              alt={likerName}
              width="120"
              height="120"
              style={profileImage}
            />
          </Section>

          <Section style={buttonSection}>
            <Link href={`${appUrl}/likes`} style={button}>
              View Their Profile
            </Link>
          </Section>

          <Text style={footer}>
            You received this email because you enabled like notifications in your settings.
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

export default LikeNotificationEmail;

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
  border: '4px solid #f472b6',
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
