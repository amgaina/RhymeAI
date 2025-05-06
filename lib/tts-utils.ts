/**
 * Text-to-Speech (TTS) utilities for RhymeAI
 * Handles SSML conversion and voice parameter management
 */

// Define voice parameters for TTS engines
export interface TTSVoiceParams {
  gender: "male" | "female" | "neutral";
  age: "young" | "middle-aged" | "mature";
  tone: "professional" | "casual" | "energetic" | "calm" | "authoritative";
  accent: "american" | "british" | "australian" | "indian" | "neutral";
  speed: "slow" | "medium" | "fast";
  language: string;
}

// Script data interface matching the JSON structure from the AI
interface ScriptData {
  title: string;
  sections: {
    name: string;
    content: string;
  }[];
}

/**
 * Converts script data to SSML (Speech Synthesis Markup Language) for TTS engines
 * Handles special markers for pauses, emphasis, etc.
 */
export function convertToSSML(scriptData: ScriptData): string {
  // Base SSML wrapper with XML declaration and speak element
  let ssml = `<?xml version="1.0"?>
<speak version="1.1" 
       xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.w3.org/2001/10/synthesis
                 http://www.w3.org/TR/speech-synthesis11/synthesis.xsd">
`;

  // Add the title as a header with prosody for proper emphasis
  ssml += `<prosody rate="medium" pitch="medium">
  <emphasis level="strong">${escapeXml(scriptData.title)}</emphasis>
</prosody>
<break time="1s"/>
`;

  // Process each section
  scriptData.sections.forEach((section, index) => {
    // Add section name as subheader
    ssml += `<mark name="section_${index}"/>
<prosody rate="medium" pitch="medium">
  <emphasis level="moderate">${escapeXml(section.name)}</emphasis>
</prosody>
<break time="0.7s"/>
`;

    // Process section content and convert markers to SSML tags
    let content = section.content;

    // Convert [PAUSE] markers (with optional duration)
    content = content.replace(/\[PAUSE=?(\d*)\]/g, (match, duration) => {
      const pauseTime = duration ? `${duration}ms` : "500ms";
      return `<break time="${pauseTime}"/>`;
    });

    // Convert [EMPHASIS] markers
    content = content.replace(
      /\[EMPHASIS\](.*?)\[\/EMPHASIS\]/g,
      '<emphasis level="moderate">$1</emphasis>'
    );

    // Convert [BREATHE] markers
    content = content.replace(/\[BREATHE\]/g, '<break time="300ms"/>');

    // Convert [SECTION] markers
    content = content.replace(
      /\[SECTION:(.*?)\]/g,
      '<mark name="subsection_$1"/>'
    );

    // Add the processed content to SSML
    ssml += `${content}\n<break time="1s"/>\n`;
  });

  // Close the speak tag
  ssml += "</speak>";

  return ssml;
}

/**
 * Escape special XML characters to ensure valid SSML
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Apply voice parameters to SSML for specific TTS providers
 */
export function applyVoiceParams(
  ssml: string,
  params: Partial<TTSVoiceParams>
): string {
  // Get default voice parameters
  const defaultParams: TTSVoiceParams = {
    gender: "neutral",
    age: "middle-aged",
    tone: "professional",
    accent: "neutral",
    speed: "medium",
    language: "en-US",
  };

  // Merge provided params with defaults
  const voiceParams = { ...defaultParams, ...params };

  // Adjust speed based on the speed parameter
  const rateMap = {
    slow: "0.8",
    medium: "1.0",
    fast: "1.2",
  };

  // Insert prosody for the entire document based on voice params
  const rateValue = rateMap[voiceParams.speed];

  // Insert voice params at the beginning of the SSML
  const voiceOpenTag = ssml.indexOf("<speak");
  const voiceClosePos = ssml.indexOf(">", voiceOpenTag);

  if (voiceOpenTag !== -1 && voiceClosePos !== -1) {
    // Add language attribute to speak tag
    const speakTag = ssml.substring(voiceOpenTag, voiceClosePos + 1);
    const newSpeakTag = speakTag.replace(
      "<speak",
      `<speak xml:lang="${voiceParams.language}"`
    );

    // Add global prosody settings after the speak tag
    const prosodyTag = `\n<prosody rate="${rateValue}">\n`;
    const closingProsodyTag = "\n</prosody>\n";

    // Rebuild the SSML with the voice parameters
    const contentStart = voiceClosePos + 1;
    const contentEnd = ssml.lastIndexOf("</speak>");

    return (
      ssml.substring(0, voiceOpenTag) +
      newSpeakTag +
      prosodyTag +
      ssml.substring(contentStart, contentEnd) +
      closingProsodyTag +
      "</speak>"
    );
  }

  return ssml;
}

/**
 * Extract timestamps from an SSML document by analyzing the structure
 * This is useful for syncing visuals with speech
 */
export function extractTimestamps(ssml: string): Record<string, number> {
  const timestamps: Record<string, number> = {};

  // This would actually involve a more complex algorithm that estimates
  // speech duration based on word count, pauses, etc.
  // For this implementation, we'll just extract the mark names

  const markRegex = /<mark\s+name="([^"]+)"\/>/g;
  let match;
  let position = 0;

  while ((match = markRegex.exec(ssml)) !== null) {
    const markName = match[1];

    // Estimate time based on content position (very rough approximation)
    // In a real implementation, this would use a more sophisticated algorithm
    position += 1;
    timestamps[markName] = position * 10; // Rough estimate: 10 seconds per section
  }

  return timestamps;
}

/**
 * Process a script section to make it more TTS-friendly
 * Useful when users edit scripts and need to ensure TTS compatibility
 */
export function processTTSText(text: string): string {
  let processed = text;

  // Replace numbers with spelled-out versions for better pronunciation
  processed = processed.replace(/\b(\d+)\b/g, (match, number) => {
    // This is a simplification - a real implementation would use a more
    // comprehensive number-to-words conversion
    if (number < 10) {
      const words = [
        "zero",
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
        "eight",
        "nine",
      ];
      return words[parseInt(number)];
    }
    return match;
  });

  // Fix common acronyms and abbreviations
  const acronyms: Record<string, string> = {
    AI: '<say-as interpret-as="letters">AI</say-as>',
    API: '<say-as interpret-as="letters">API</say-as>',
    UI: '<say-as interpret-as="letters">UI</say-as>',
    UX: '<say-as interpret-as="letters">UX</say-as>',
    CEO: '<say-as interpret-as="letters">CEO</say-as>',
    CTO: '<say-as interpret-as="letters">CTO</say-as>',
    CFO: '<say-as interpret-as="letters">CFO</say-as>',
  };

  Object.entries(acronyms).forEach(([acronym, replacement]) => {
    const regex = new RegExp(`\\b${acronym}\\b`, "g");
    processed = processed.replace(regex, replacement);
  });

  return processed;
}
