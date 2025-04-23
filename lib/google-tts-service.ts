/**
 * Google Cloud Text-to-Speech service implementation for RhymeAI
 */
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

// Initialize the client with credentials
// In production, these would be loaded from environment variables
let ttsClient: TextToSpeechClient | null = null;

/**
 * Initialize the Google Cloud TTS client
 */
function initializeClient() {
  if (!ttsClient) {
    try {
      // Check if credentials are available
      if (!process.env.GOOGLE_CREDENTIALS_JSON) {
        console.warn("Google Cloud credentials not found. Using fallback TTS.");
        return null;
      }

      // If GOOGLE_CREDENTIALS_JSON is provided as a string, use it directly
      if (process.env.GOOGLE_CREDENTIALS_JSON) {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        ttsClient = new TextToSpeechClient({ credentials });
      } else {
        // Otherwise, use the credentials file path
        ttsClient = new TextToSpeechClient();
      }

      return ttsClient;
    } catch (error) {
      console.error("Failed to initialize Google Cloud TTS client:", error);
      return null;
    }
  }

  return ttsClient;
}

/**
 * Generate audio from SSML using Google Cloud TTS
 * @param ssml The SSML to convert to audio
 * @param voiceId The voice ID to use
 * @returns A buffer containing the audio data
 */
export async function generateGoogleTTS(
  ssml: string,
  voiceId: string
): Promise<Buffer> {
  const client = initializeClient();

  if (!client) {
    // Return a mock audio buffer if client initialization failed
    console.warn(
      "Using mock audio data due to missing Google Cloud TTS client"
    );
    return Buffer.from("Mock audio data");
  }

  try {
    // Parse the voice ID to extract language code and voice name
    // Format: en-US-Neural2-A
    const parts = voiceId.split("-");
    const languageCode = `${parts[0]}-${parts[1]}`;
    const name = voiceId;

    const request = {
      input: { ssml },
      voice: { languageCode, name },
      audioConfig: { audioEncoding: "MP3" },
    };

    const [response] = await client.synthesizeSpeech(request);

    if (response.audioContent) {
      return Buffer.from(response.audioContent as Uint8Array);
    } else {
      throw new Error("No audio content returned from Google TTS");
    }
  } catch (error) {
    console.error("Google TTS error:", error);
    throw error;
  }
}

/**
 * Get available voices from Google Cloud TTS
 * @returns A list of available voices
 */
export async function getGoogleVoices() {
  const client = initializeClient();

  if (!client) {
    // Return mock voices if client initialization failed
    return getMockVoices();
  }

  try {
    const [response] = await client.listVoices({});

    // Filter and map the voices to our format
    return (
      response.voices
        ?.filter((voice) => voice.languageCodes?.[0]?.startsWith("en"))
        .map((voice) => ({
          id: voice.name || "",
          name: voice.name?.split("-").pop() || "",
          gender: voice.ssmlGender?.toLowerCase() || "neutral",
          language: voice.languageCodes?.[0] || "en-US",
        })) || getMockVoices()
    );
  } catch (error) {
    console.error("Failed to get Google TTS voices:", error);
    return getMockVoices();
  }
}

/**
 * Get mock voices when Google Cloud TTS is not available
 */
function getMockVoices() {
  return [
    {
      id: "en-US-Neural2-A",
      name: "Matthew",
      gender: "male",
      language: "en-US",
    },
    {
      id: "en-US-Neural2-C",
      name: "Emma",
      gender: "female",
      language: "en-US",
    },
    { id: "en-US-Neural2-D", name: "Brian", gender: "male", language: "en-US" },
    {
      id: "en-US-Neural2-E",
      name: "Olivia",
      gender: "female",
      language: "en-US",
    },
    { id: "en-US-Neural2-F", name: "James", gender: "male", language: "en-US" },
    {
      id: "en-GB-Neural2-A",
      name: "Arthur",
      gender: "male",
      language: "en-GB",
    },
    {
      id: "en-GB-Neural2-C",
      name: "Charlotte",
      gender: "female",
      language: "en-GB",
    },
    { id: "en-AU-Neural2-A", name: "Noah", gender: "male", language: "en-AU" },
    {
      id: "en-AU-Neural2-B",
      name: "Isla",
      gender: "female",
      language: "en-AU",
    },
  ];
}

/**
 * Get the best Google voice for the given parameters
 * @param params Voice parameters
 * @returns The best matching voice ID
 */
export async function getBestGoogleVoiceMatch(params: {
  gender?: string;
  accent?: string;
  age?: string;
}): Promise<string> {
  const voices = await getGoogleVoices();

  // Filter voices based on gender
  let filteredVoices = voices;
  if (params.gender) {
    filteredVoices = filteredVoices.filter((v) => v.gender === params.gender);
  }

  // Filter voices based on accent/language
  if (params.accent) {
    const accentMap: Record<string, string> = {
      american: "en-US",
      british: "en-GB",
      australian: "en-AU",
      indian: "en-IN",
      neutral: "en-US",
    };

    const languageCode =
      accentMap[params.accent as keyof typeof accentMap] || "en-US";
    filteredVoices = filteredVoices.filter((v) => v.language === languageCode);
  }

  // If no voices match the filters, return a default voice
  if (filteredVoices.length === 0) {
    return "en-US-Neural2-A"; // Default voice
  }

  // Return the first matching voice
  return filteredVoices[0].id;
}
