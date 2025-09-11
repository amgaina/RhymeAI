# Text-to-Speech (TTS) System

This document explains how the Text-to-Speech (TTS) system works in RhymeAI.

## Overview

RhymeAI uses Google Cloud Text-to-Speech to generate high-quality audio for event scripts. The system is designed to:

1. Generate audio for individual script segments
2. Store audio files in AWS S3
3. Properly handle audio deletion when scripts are modified or deleted
4. Support SSML for enhanced speech control

## Architecture

The TTS system consists of several components:

### 1. Google TTS Utilities (`lib/google-tts.ts`)

This module provides utilities for interacting with Google Cloud TTS:

- `generateTTS`: Generates TTS audio using Google Cloud
- `parseSSMLMarkers`: Converts custom markers to SSML tags
- `getVoiceConfigFromSettings`: Gets voice configuration from event settings
- `generateAndUploadTTS`: Generates TTS and uploads to S3
- `estimateTTSDuration`: Estimates the duration of TTS audio

### 2. S3 Storage Utilities (`lib/s3-utils.ts`)

This module handles storing and retrieving audio files from AWS S3:

- `uploadToS3`: Uploads a buffer to S3
- `getPresignedUrl`: Generates a presigned URL for an S3 object
- `generateAudioKey`: Generates a unique S3 key for an audio file
- `deleteEventAudio`: Deletes all audio files for an event
- `deleteSegmentAudio`: Deletes audio for a specific segment

### 3. Server Actions (`app/actions/event/tts-generation.ts`)

These server actions handle TTS generation and management:

- `generateTTSForAllSegments`: Generates TTS for all script segments
- `generateTTSForSegment`: Generates TTS for a single script segment
- `deleteScriptSegmentAudio`: Deletes audio for a script segment
- `deleteAllEventAudio`: Deletes all audio for an event

### 4. Script Generation (`app/actions/event/enhanced-script-generation.ts`)

This module handles script generation with audio cleanup:

- `generateEnhancedScriptFromLayout`: Generates script segments from layout
- Deletes existing audio when regenerating scripts

## SSML Support

The system supports Speech Synthesis Markup Language (SSML) for enhanced speech control. You can use the following custom markers in your script text:

- `[PAUSE=300]`: Adds a pause of 300 milliseconds
- `[BREATHE]`: Adds a natural breathing pause
- `[EMPHASIS]text[/EMPHASIS]`: Emphasizes the enclosed text
- `[SLOW]text[/SLOW]`: Speaks the enclosed text slowly
- `[FAST]text[/FAST]`: Speaks the enclosed text quickly
- `[SOFT]text[/SOFT]`: Speaks the enclosed text softly
- `[LOUD]text[/LOUD]`: Speaks the enclosed text loudly

These markers are automatically converted to proper SSML tags when generating TTS.

## Voice Configuration

The system supports multiple voice profiles:

- **Professional**: Formal, clear speech (default)
- **Casual**: Relaxed, conversational tone
- **Energetic**: Upbeat, enthusiastic delivery
- **Formal**: Very formal, authoritative tone

Each profile has specific settings for language, voice, gender, speaking rate, and pitch.

## Usage

### Generating TTS for All Segments

```typescript
const result = await generateTTSForAllSegments(eventId);
```

### Generating TTS for a Single Segment

```typescript
const result = await generateTTSForSegment(segmentId);
```

### Deleting Audio for a Segment

```typescript
const result = await deleteScriptSegmentAudio(segmentId);
```

### Deleting All Audio for an Event

```typescript
const result = await deleteAllEventAudio(eventId);
```

## Environment Setup

To use the TTS system, you need to set up the following environment variables:

```
# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="rhymeai-audio"
```

For Google Cloud TTS, you have three configuration options:

### Option 1: API Key (Simplest)

```
GOOGLE_API_KEY="AIzaSyYourGoogleApiKeyHere"
GOOGLE_PROJECT_ID="your-project-id"
```

### Option 2: Service Account JSON

```
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'
```

### Option 3: Service Account Key File

```
GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
```

See the `ENV_SETUP.md` file for detailed instructions on setting up these environment variables.

## Error Handling

The TTS system includes comprehensive error handling:

- Checks if TTS is properly configured before attempting generation
- Marks segments as "failed" if TTS generation fails
- Provides detailed error messages for troubleshooting
- Handles S3 upload failures gracefully

## Performance Considerations

- Audio files are generated asynchronously to avoid blocking the UI
- Duration is estimated based on content length and speaking rate
- Audio files are cached in S3 for efficient delivery
- Segments are processed in parallel for faster generation
