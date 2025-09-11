# RhymeAI Database and Storage Integration

This document provides an overview of how RhymeAI stores and manages data in the database and S3 storage.

## Database Schema

RhymeAI uses a PostgreSQL database with the following main tables:

### Events Table

The `events` table stores information about events:

- `event_id`: Primary key
- `user_id`: ID of the user who created the event
- `title`: Event title
- `description`: Event description
- `event_type`: Type of event (conference, webinar, etc.)
- `status`: Event status (draft, ready, completed, cancelled)
- `event_date`: Date of the event
- `voice_settings`: JSON object with voice preferences
- `script_segments`: JSON array of script segments (for quick access)
- `event_layout`: JSON array of event layout segments

### Script Segments Table

The `script_segments` table stores individual script segments:

- `id`: Primary key
- `event_id`: Foreign key to the events table
- `segment_type`: Type of segment (introduction, keynote, etc.)
- `content`: Text content of the segment
- `audio_url`: URL to the audio file in S3
- `status`: Status of the segment (draft, editing, generated, generating)
- `timing`: Duration of the segment in seconds
- `order`: Order of the segment in the script

### Chat Messages Table

The `chat_messages` table stores chat messages related to event creation:

- `id`: Primary key
- `event_id`: Foreign key to the events table
- `user_id`: ID of the user who sent the message
- `role`: Role of the message sender (user or assistant)
- `content`: Text content of the message
- `message_id`: Unique ID from the chat system
- `tool_calls`: JSON object with tool calls made by the assistant

## Data Flow

### Event Creation

1. User provides event information through the chat interface
2. The `storeEventDataTool` creates a new event in the `events` table
3. The event is created with a status of "draft"

### Event Layout Generation

1. The `generateEventLayoutTool` generates a layout based on the event type
2. The layout is stored in the `event_layout` field of the `events` table
3. The layout includes segment names, types, descriptions, durations, and order

### Script Generation

1. The `generateScriptFromLayoutTool` converts the layout into script segments
2. Each segment is stored in the `script_segments` table
3. A JSON representation of the segments is also stored in the `script_segments` field of the `events` table
4. The event status is updated to "scripting"

### Audio Generation

1. The `generateAudioTool` generates audio for each script segment
2. The audio is generated using a TTS service
3. The audio file is uploaded to S3
4. The S3 URL is stored in the `audio_url` field of the `script_segments` table
5. The segment status is updated to "generated"
6. The JSON representation in the `events` table is also updated

### Presentation Generation

1. The `generatePresentationTool` creates a presentation with audio and visuals
2. The presentation is stored in S3
3. The S3 URL is stored in the `presentation_url` field of the `events` table
4. The event status is updated to "ready"

## S3 Storage

RhymeAI uses Amazon S3 for storing audio files and presentations:

### Audio Files

- Audio files are stored in the `audio/` prefix
- Each file is named using the pattern `event-{eventId}/segment-{segmentId}-{timestamp}.mp3`
- Audio files are stored with the MIME type `audio/mpeg`

### Presentations

- Presentations are stored in the `presentations/` prefix
- Each file is named using the pattern `event-{eventId}/presentation-{timestamp}.pptx`
- Presentations are stored with the MIME type `application/vnd.openxmlformats-officedocument.presentationml.presentation`

## Synchronization

To ensure data consistency, RhymeAI implements several synchronization mechanisms:

### Script Segments Synchronization

The `updateEventScriptSegments` function ensures that the JSON representation of script segments in the `events` table is always in sync with the actual segments in the `script_segments` table. This function is called:

1. After creating new script segments
2. After updating existing script segments
3. After generating audio for segments

### Chat Messages Synchronization

The `syncChatMessages` function ensures that chat messages are stored in the database for future reference. This function is called:

1. Periodically during the chat session
2. When the chat session ends
3. When important milestones are reached (e.g., event creation, script generation)

## Error Handling

RhymeAI implements robust error handling to ensure data integrity:

### Audio Generation Fallbacks

If the TTS service fails to generate audio, RhymeAI:

1. Logs the error
2. Generates a fallback URL
3. Updates the segment with the fallback URL
4. Marks the segment as "generated" to allow the workflow to continue

### Database Transaction Handling

All database operations are wrapped in try-catch blocks to handle errors gracefully:

1. If an operation fails, the error is logged
2. The user is notified of the failure
3. The system attempts to continue with the next operation if possible

## Configuration

To configure S3 storage, set the following environment variables:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name
```

If these variables are not set, RhymeAI will fall back to using mock URLs for audio files and presentations.
