# RhymeAI Chat API

This directory contains the API routes and tools for the RhymeAI chat functionality.

## Directory Structure

```
app/api/chat/
├── prompts/                 # System prompts for different contexts
│   ├── index.ts             # Main export for all prompts
│   ├── event-creation.ts    # Prompts for event information collection
│   ├── event-layout.ts      # Prompts for event layout generation
│   ├── script-generation.ts # Prompts for script generation
│   ├── voice-selection.ts   # Prompts for voice selection
│   ├── audio-generation.ts  # Prompts for audio generation
│   └── presentation.ts      # Prompts for presentation generation
├── tools/                   # AI tools for different functionalities
│   ├── index.ts             # Main export for all tools
│   ├── event-tools.ts       # Tools for event creation and management
│   ├── script-tools.ts      # Tools for script generation and management
│   ├── audio-tools.ts       # Tools for audio generation
│   └── presentation-tools.ts # Tools for presentation generation
├── prompts.ts               # Re-exports all prompts
├── tools.ts                 # Re-exports all tools
└── route.ts                 # API route handler for chat
```

## Workflow

The RhymeAI chat API supports the following workflow:

1. **Event Creation**: Collect event information using `storeEventDataTool`
2. **Event Layout**: Generate event layout with timing using `generateEventLayoutTool`
3. **Script Generation**: Generate script segments from layout using `generateScriptFromLayoutTool`
4. **Script Editing**: Update script segments using `updateScriptTool`
5. **Audio Generation**: Generate audio for script segments using `generateAudioTool`
6. **Presentation Creation**: Generate presentation with audio using `generatePresentationTool`
7. **Event Finalization**: Finalize the event using `finalizeEventTool`

## Prompts

The system prompts are organized by context type:

- `event-creation`: Prompts for collecting event information
- `event-layout`: Prompts for generating event layout
- `script-generation`: Prompts for generating script content
- `voice-selection`: Prompts for selecting voice characteristics
- `audio-generation`: Prompts for generating audio
- `presentation`: Prompts for creating presentations

## Tools

The AI tools are organized by functionality:

### Event Tools
- `storeEventDataTool`: Store event information
- `generateEventLayoutTool`: Generate event layout with timing
- `updateLayoutSegmentTool`: Update layout segments
- `finalizeEventTool`: Finalize an event

### Script Tools
- `generateScriptFromLayoutTool`: Generate script from layout
- `generateScriptTool`: Generate script directly
- `updateScriptTool`: Update script segments

### Audio Tools
- `generateAudioTool`: Generate audio for a script segment
- `batchGenerateAudioTool`: Generate audio for multiple segments

### Presentation Tools
- `generatePresentationTool`: Generate presentation with audio
- `customizePresentationTool`: Customize presentation theme
- `previewPresentationTool`: Preview presentation

## Usage

To use the chat API, make a POST request to `/api/chat` with the following body:

```json
{
  "messages": [
    { "role": "user", "content": "Create an event script for my tech conference" }
  ],
  "context": {
    "purpose": "To create a customized AI host script for an event",
    "requiredFields": [
      "eventName",
      "eventType",
      "eventDate",
      "eventLocation",
      "expectedAttendees",
      "eventDescription"
    ],
    "contextType": "event-creation"
  }
}
```

The `contextType` determines which system prompt is used, and the available tools are determined by the context.
