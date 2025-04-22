# RhymeAI Tools Documentation

This document provides an overview of the tools and workflow for generating event scripts, audio, and presentations in RhymeAI.

## Workflow Overview

The RhymeAI script and audio generation workflow follows these steps:

1. **Collect Event Information**: Gather basic event details like name, type, date, location, etc.
2. **Generate Event Layout**: Create a rough layout of the event with timing suggestions for each segment
3. **Generate Script Segments**: Convert the layout into actual script segments with content
4. **Edit and Refine Scripts**: Allow users to edit and refine the generated script segments
5. **Generate Audio**: Create audio files for each script segment using TTS
6. **Create Presentation**: Generate a presentation with synchronized audio and visuals
7. **Finalize Event**: Mark the event as ready for presentation

## Available Tools

### 1. Event Data Storage Tool

The `storeEventDataTool` collects and stores basic event information.

**Parameters:**
- `eventName` (required): Name of the event
- `eventType` (required): Type of event (conference, webinar, etc.)
- `eventDate` (required): Date of the event
- `eventLocation` (optional): Location where the event will be held
- `audienceSize` (optional): Expected number of attendees
- `speakerInfo` (optional): Information about speakers
- `voicePreference` (optional): Voice settings for TTS
- `language` (optional): Language for the event
- `eventDescription` (optional): Description of the event

### 2. Event Layout Generation Tool

The `generateEventLayoutTool` creates a rough event layout with timing suggestions based on the event type.

**Parameters:**
- `eventId` (required): ID of the event
- `eventType` (optional): Type of event (if different from stored event)
- `totalDuration` (optional): Total duration of the event in minutes

### 3. Layout Segment Update Tool

The `updateLayoutSegmentTool` allows updating segments in the event layout.

**Parameters:**
- `eventId` (required): ID of the event
- `segmentIndex` (required): Index of the segment to update
- `name` (optional): New name for the segment
- `type` (optional): New type for the segment
- `description` (optional): New description for the segment
- `duration` (optional): New duration for the segment in minutes
- `order` (optional): New order for the segment

### 4. Script Generation Tool

The `generateScriptFromLayoutTool` converts the event layout into actual script segments with content.

**Parameters:**
- `eventId` (required): ID of the event

### 5. Script Update Tool

The `updateScriptTool` allows updating existing script segments.

**Parameters:**
- `eventId` (required): ID of the event
- `segmentId` (required): ID of the segment to update
- `content` (optional): New content for the segment
- `type` (optional): New type for the segment
- `status` (optional): New status for the segment (draft, edited, generated, approved)
- `order` (optional): New order for the segment

### 6. Audio Generation Tool

The `generateAudioTool` creates audio files for script segments using TTS.

**Parameters:**
- `eventId` (required): ID of the event
- `segmentId` (required): ID of the segment to generate audio for
- `voiceSettings` (optional): Voice settings for TTS

### 7. Presentation Generation Tool

The `generatePresentationTool` creates a presentation with audio and visuals for the event.

**Parameters:**
- `eventId` (required): ID of the event
- `title` (optional): Title for the presentation
- `theme` (optional): Theme for the presentation (professional, creative, minimal, bold)
- `includeAudio` (optional): Whether to include audio in the presentation

### 8. Event Finalization Tool

The `finalizeEventTool` marks an event as ready for presentation.

**Parameters:**
- `eventId` (required): ID of the event

## Implementation Details

### Server Actions

The tools use server actions to interact with the database and perform operations:

- `createEvent`: Creates a new event with basic information
- `generateEventLayout`: Generates a layout for the event
- `updateEventLayoutSegment`: Updates a segment in the event layout
- `generateScriptFromLayout`: Converts the layout into script segments
- `createScriptSegment`: Creates a new script segment
- `updateScriptSegment`: Updates an existing script segment
- `generateEventPresentation`: Generates a presentation for the event
- `finalizeEvent`: Marks an event as ready for presentation

### TTS API

The TTS API is implemented in `/api/tts/generate` and provides the following functionality:

- Generate audio from script segments
- Apply voice settings to the generated audio
- Store audio files (simulated in the current implementation)
- Update script segments with audio URLs

## Example Usage

### Complete Workflow

1. Collect event information:
```javascript
const eventResult = await storeEventDataTool({
  eventName: "Tech Conference 2023",
  eventType: "conference",
  eventDate: "2023-12-15",
  eventLocation: "San Francisco, CA",
  audienceSize: "500",
  language: "English",
  voicePreference: {
    gender: "neutral",
    tone: "professional",
    accent: "american",
    speed: "medium",
    pitch: "medium"
  },
  eventDescription: "Annual technology conference featuring industry experts"
});

const eventId = eventResult.eventId;
```

2. Generate event layout:
```javascript
const layoutResult = await generateEventLayoutTool({
  eventId
});
```

3. Generate script from layout:
```javascript
const scriptResult = await generateScriptFromLayoutTool({
  eventId
});
```

4. Update a script segment:
```javascript
const segmentId = scriptResult.segments[0].id;
const updateResult = await updateScriptTool({
  eventId,
  segmentId,
  content: "Welcome to our amazing Tech Conference 2023! I'm your AI host for today."
});
```

5. Generate audio for a segment:
```javascript
const audioResult = await generateAudioTool({
  eventId,
  segmentId
});
```

6. Generate presentation:
```javascript
const presentationResult = await generatePresentationTool({
  eventId,
  theme: "professional",
  includeAudio: true
});
```

7. Finalize the event:
```javascript
const finalizeResult = await finalizeEventTool({
  eventId
});
```

## Technical Notes

- Audio files are currently simulated with mock URLs
- In a production environment, audio files would be stored in S3 or similar storage
- The TTS implementation can be replaced with any TTS provider (Google, Amazon, etc.)
- Script generation uses templates based on event type, but could be enhanced with AI
