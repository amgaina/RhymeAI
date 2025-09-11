import { NextRequest, NextResponse } from 'next/server';
import { createEvent } from '@/app/actions/event/create-event';

export async function POST(request: NextRequest) {
  try {
    // Get form data from the request
    const formData = await request.formData();
    
    console.log('API route received form data:', Object.fromEntries(formData.entries()));
    
    // Call the server action with the form data
    const result = await createEvent(formData);
    
    if (result.success) {
      // Redirect to the event creation page
      return NextResponse.redirect(new URL(`/event-creation?eventId=${result.eventId}`, request.url));
    } else {
      // Return error response
      return NextResponse.json(
        { error: result.error || 'Failed to create event' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in event creation API route:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
