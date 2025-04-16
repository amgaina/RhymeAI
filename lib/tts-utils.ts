/**
 * Utility functions for text-to-speech conversion in RhymeAI
 */

/**
 * Prepares script content for TTS processing by normalizing special markers
 */
export function prepareTTSScript(scriptContent: string): string {
  // Replace custom markers with standard SSML tags
  return (
    scriptContent
      .replace(/\[PAUSE=(\d+)\]/g, '<break time="$1ms"/>')
      .replace(/\[PAUSE\]/g, '<break time="500ms"/>')
      .replace(/\[EMPHASIS\](.*?)\[\/EMPHASIS\]/g, "<emphasis>$1</emphasis>")
      .replace(/\[EMPHASIS\](.*?)(?=\[|$)/g, "<emphasis>$1</emphasis>")
      .replace(/\[BREATHE\]/g, '<break time="300ms"/>')
      // Handle section markers
      .replace(/\[SECTION: (.*?)\]/g, "<!-- Section: $1 -->")
  );
}

/**
 * Converts a script to SSML format suitable for TTS APIs
 */
export function convertToSSML(script: any): string {
  if (!script || !script.sections) {
    throw new Error("Invalid script format");
  }

  let ssml = "<speak>\n";

  script.sections.forEach((section: any, index: number) => {
    ssml += `<!-- Section: ${section.name} -->\n`;
    ssml += `${prepareTTSScript(section.content)}\n`;

    // Add pauses between sections
    if (index < script.sections.length - 1) {
      ssml += '<break time="1s"/>\n';
    }
  });

  ssml += "</speak>";

  return ssml;
}

/**
 * Interface for voice parameters used in TTS requests
 */
export interface TTSVoiceParams {
  gender: "male" | "female" | "neutral";
  age: "young" | "middle-aged" | "mature";
  tone: "professional" | "casual" | "energetic" | "calm" | "authoritative";
  accent: "american" | "british" | "australian" | "indian" | "neutral";
  speed: "slow" | "medium" | "fast";
  language: string;
}

/**
 * Maps voice parameters to specific TTS provider voice IDs
 * This would be expanded based on which TTS providers are integrated
 */
export function mapVoiceParams(params: Partial<TTSVoiceParams>): string {
  // This is a simplified example - would be replaced with actual provider mapping logic
  const voiceMap: { [key: string]: string } = {
    male_professional_american: "en-US-Neural2-D",
    female_professional_american: "en-US-Neural2-F",
    male_energetic_british: "en-GB-Neural2-B",
    female_casual_american: "en-US-Neural2-E",
    // Add more mappings as needed
  };

  // Create a key from the params to look up in the voice map
  const key = `${params.gender || "neutral"}_${params.tone || "professional"}_${
    params.accent || "american"
  }`;

  // Return the mapped voice or a default
  return voiceMap[key] || "en-US-Neural2-D";
}
