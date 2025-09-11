export interface EventFormValues {
  // Event Details
  eventName: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  timezone?: string;
  eventDescription?: string;
  expectedAttendees?: string;
  eventFormat?: string;

  // Voice Settings
  primaryVoice?: string;
  accent?: string;
  speakingStyle?: string;
  speakingRate: number;
  pitch: number;
  multilingual: boolean;

  // Script Settings
  scriptTemplate?: string;
  customScript?: string;
  autoGenerate: boolean;
}
