import { ToolCall } from "ai"; // Import from ai package instead of BaseToolView
import { BaseToolView } from "./BaseToolView";
import { EventDataToolView } from "./EventDataToolView";
import { ScriptGenerationToolView } from "./ScriptGenerationToolView";
import { LayoutGenerationToolView } from "./LayoutGenerationToolView";
import { EventListingToolView } from "./EventListingToolView";
import { EventDetailsToolView } from "./EventDetailsToolView";
import { EventScriptToolView } from "./EventScriptToolView";
import { EventLayoutToolView } from "./EventLayoutToolView";
import { VoiceSettingsToolView } from "./VoiceSettingsToolView";
import { AudioGenerationToolView } from "./AudioGenerationToolView";
import { PresentationToolView } from "./PresentationToolView";
import ScriptAudioToolView from "./ScriptAudioToolView";

interface ToolViewFactoryProps {
  tool: ToolCall;
  eventId?: string | number;
}

export function ToolViewFactory({ tool, eventId }: ToolViewFactoryProps) {
  // Select the appropriate component based on tool name
  switch (tool.toolName) {
    // Event creation and storage tools
    case "store_event_data":
      return <EventDataToolView tool={tool} />;

    // Event query tools
    case "list_events":
    case "get_events":
      return <EventListingToolView tool={tool} />;

    case "get_event_details":
      return <EventDetailsToolView tool={tool} eventId={eventId} />;

    case "get_event_script":
      return <EventScriptToolView tool={tool} eventId={eventId} />;

    case "get_event_layout":
      return <EventLayoutToolView tool={tool} eventId={eventId} />;

    case "get_voice_settings":
      return <VoiceSettingsToolView tool={tool} />;

    // Event modification tools
    case "generate_event_layout":
    case "generate_layout":
      return <LayoutGenerationToolView tool={tool} />;

    case "update_layout_segment":
      return <LayoutGenerationToolView tool={tool} isUpdate={true} />;

    case "update_script_segment":
      return <ScriptGenerationToolView tool={tool} isUpdate={true} />;

    case "update_voice_settings":
      return <VoiceSettingsToolView tool={tool} isUpdate={true} />;

    // Script generation tools
    case "generate_script":
    case "generate_script_from_layout":
      return <ScriptGenerationToolView tool={tool} />;

    // Audio generation tools
    case "generate_audio":
    case "generate_batch_audio":
      return <AudioGenerationToolView tool={tool} />;

    case "list_all_script_audio":
      return <ScriptAudioToolView tool={tool} />;

    // Presentation tools
    case "generate_presentation":
      return <PresentationToolView tool={tool} />;

    default:
      // Fallback to the base view for any other tool
      return <BaseToolView tool={tool} />;
  }
}
