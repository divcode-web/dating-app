import { NextRequest, NextResponse } from 'next/server';
import * as brevo from '@getbrevo/brevo';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error('Brevo API key not configured');
      return NextResponse.json(
        { error: 'Newsletter service not configured' },
        { status: 500 }
      );
    }

    // Initialize Brevo API client
    const apiInstance = new brevo.ContactsApi();
    apiInstance.setApiKey(brevo.ContactsApiApiKeys.apiKey, apiKey);

    const createContact = new brevo.CreateContact();
    createContact.email = email;
    if (name) {
      createContact.attributes = { FIRSTNAME: name };
    }
    // Add to newsletter list (you'll need to create a list in Brevo dashboard and get the ID)
    // Replace with your actual list ID from Brevo dashboard
    const listId = parseInt(process.env.BREVO_NEWSLETTER_LIST_ID || '1');
    createContact.listIds = [listId];
    createContact.updateEnabled = true; // Update if contact already exists

    await apiInstance.createContact(createContact);

    return NextResponse.json({
      message: 'Successfully subscribed to newsletter!',
      success: true,
    });
  } catch (error: any) {
    console.error('Newsletter subscription error:', error);

    // Brevo returns specific error codes
    if (error.response?.statusCode === 400 && error.response?.body?.code === 'duplicate_parameter') {
      return NextResponse.json({
        message: 'This email is already subscribed to our newsletter!',
        success: true,
      });
    }

    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    );
  }
}
