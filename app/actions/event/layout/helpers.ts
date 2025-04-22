import { v4 as uuidv4 } from "uuid";
import { EventType, LayoutSegment, SegmentType } from "@/types/layout";

/**
 * Generate layout segments based on event type
 */
export function generateLayoutByEventType(
  eventType: EventType = "general",
  eventTitle: string = "Event",
  totalDuration: number = 60
): LayoutSegment[] {
  const type = (eventType?.toLowerCase() as EventType) || "general";

  if (type.includes("conference")) {
    return generateConferenceLayout(eventTitle, totalDuration);
  } else if (type.includes("webinar")) {
    return generateWebinarLayout(eventTitle, totalDuration);
  } else if (type.includes("workshop")) {
    return generateWorkshopLayout(eventTitle, totalDuration);
  } else if (type.includes("corporate")) {
    return generateCorporateLayout(eventTitle, totalDuration);
  } else {
    return generateGeneralLayout(eventTitle, totalDuration);
  }
}

/**
 * Generate a conference event layout
 */
function generateConferenceLayout(
  eventTitle: string,
  totalDuration: number
): LayoutSegment[] {
  // Calculate segment durations based on total duration
  const introductionTime = Math.max(5, Math.round(totalDuration * 0.05));
  const keynoteTime = Math.max(30, Math.round(totalDuration * 0.25));
  const panelTime = Math.max(45, Math.round(totalDuration * 0.3));
  const breakTime = Math.max(15, Math.round(totalDuration * 0.1));
  const qAndATime = Math.max(15, Math.round(totalDuration * 0.1));
  const closingTime = Math.max(10, Math.round(totalDuration * 0.05));

  return [
    {
      id: uuidv4(),
      name: "Welcome and Introduction",
      type: "introduction",
      description: "Opening remarks and welcome to attendees",
      duration: introductionTime,
      order: 1,
    },
    {
      id: uuidv4(),
      name: "Keynote Presentation",
      type: "keynote",
      description: "Main keynote speech by the featured speaker",
      duration: keynoteTime,
      order: 2,
    },
    {
      id: uuidv4(),
      name: "Panel Discussion",
      type: "panel",
      description: "Expert panel discussing industry trends",
      duration: panelTime,
      order: 3,
    },
    {
      id: uuidv4(),
      name: "Networking Break",
      type: "break",
      description: "Refreshments and networking opportunity",
      duration: breakTime,
      order: 4,
    },
    {
      id: uuidv4(),
      name: "Q&A Session",
      type: "q_and_a",
      description: "Audience questions for speakers",
      duration: qAndATime,
      order: 5,
    },
    {
      id: uuidv4(),
      name: "Closing Remarks",
      type: "conclusion",
      description: "Summary and closing thoughts",
      duration: closingTime,
      order: 6,
    },
  ];
}

/**
 * Generate a webinar event layout
 */
function generateWebinarLayout(
  eventTitle: string,
  totalDuration: number
): LayoutSegment[] {
  // Calculate segment durations based on total duration
  const introductionTime = Math.max(5, Math.round(totalDuration * 0.08));
  const presentationTime = Math.max(30, Math.round(totalDuration * 0.5));
  const demoTime = Math.max(15, Math.round(totalDuration * 0.2));
  const qAndATime = Math.max(15, Math.round(totalDuration * 0.17));
  const closingTime = Math.max(5, Math.round(totalDuration * 0.05));

  return [
    {
      id: uuidv4(),
      name: "Welcome and Introduction",
      type: "introduction",
      description: "Introduction to the webinar and speakers",
      duration: introductionTime,
      order: 1,
    },
    {
      id: uuidv4(),
      name: "Main Presentation",
      type: "presentation",
      description: "Core content presentation",
      duration: presentationTime,
      order: 2,
    },
    {
      id: uuidv4(),
      name: "Product Demonstration",
      type: "demo",
      description: "Live demonstration or walkthrough",
      duration: demoTime,
      order: 3,
    },
    {
      id: uuidv4(),
      name: "Q&A Session",
      type: "q_and_a",
      description: "Answering attendee questions",
      duration: qAndATime,
      order: 4,
    },
    {
      id: uuidv4(),
      name: "Closing and Next Steps",
      type: "conclusion",
      description: "Summary and call to action",
      duration: closingTime,
      order: 5,
    },
  ];
}

/**
 * Generate a workshop event layout
 */
function generateWorkshopLayout(
  eventTitle: string,
  totalDuration: number
): LayoutSegment[] {
  // Calculate segment durations based on total duration
  const introductionTime = Math.max(10, Math.round(totalDuration * 0.08));
  const theoryTime = Math.max(20, Math.round(totalDuration * 0.2));
  const practicalTime = Math.max(45, Math.round(totalDuration * 0.4));
  const breakTime = Math.max(10, Math.round(totalDuration * 0.08));
  const groupWorkTime = Math.max(20, Math.round(totalDuration * 0.15));
  const closingTime = Math.max(10, Math.round(totalDuration * 0.09));

  return [
    {
      id: uuidv4(),
      name: "Welcome and Overview",
      type: "introduction",
      description: "Introduction to the workshop and objectives",
      duration: introductionTime,
      order: 1,
    },
    {
      id: uuidv4(),
      name: "Theoretical Background",
      type: "theory",
      description: "Explanation of key concepts",
      duration: theoryTime,
      order: 2,
    },
    {
      id: uuidv4(),
      name: "Practical Exercise",
      type: "practical",
      description: "Hands-on activity for participants",
      duration: practicalTime,
      order: 3,
    },
    {
      id: uuidv4(),
      name: "Break",
      type: "break",
      description: "Short break for refreshments",
      duration: breakTime,
      order: 4,
    },
    {
      id: uuidv4(),
      name: "Group Discussion",
      type: "group_work",
      description: "Collaborative problem-solving",
      duration: groupWorkTime,
      order: 5,
    },
    {
      id: uuidv4(),
      name: "Conclusion and Takeaways",
      type: "conclusion",
      description: "Summary and next steps",
      duration: closingTime,
      order: 6,
    },
  ];
}

/**
 * Generate a corporate event layout
 */
function generateCorporateLayout(
  eventTitle: string,
  totalDuration: number
): LayoutSegment[] {
  // Calculate segment durations based on total duration
  const introductionTime = Math.max(5, Math.round(totalDuration * 0.08));
  const agendaTime = Math.max(5, Math.round(totalDuration * 0.05));
  const presentationTime = Math.max(30, Math.round(totalDuration * 0.4));
  const discussionTime = Math.max(20, Math.round(totalDuration * 0.25));
  const actionItemsTime = Math.max(10, Math.round(totalDuration * 0.12));
  const closingTime = Math.max(5, Math.round(totalDuration * 0.1));

  return [
    {
      id: uuidv4(),
      name: "Welcome and Introduction",
      type: "introduction",
      description: "Opening remarks and introductions",
      duration: introductionTime,
      order: 1,
    },
    {
      id: uuidv4(),
      name: "Meeting Agenda",
      type: "agenda",
      description: "Overview of topics to be covered",
      duration: agendaTime,
      order: 2,
    },
    {
      id: uuidv4(),
      name: "Business Update",
      type: "presentation",
      description: "Presentation of key business metrics and updates",
      duration: presentationTime,
      order: 3,
    },
    {
      id: uuidv4(),
      name: "Strategic Discussion",
      type: "discussion",
      description: "Discussion of strategic initiatives",
      duration: discussionTime,
      order: 4,
    },
    {
      id: uuidv4(),
      name: "Action Items",
      type: "action_items",
      description: "Assignment of tasks and responsibilities",
      duration: actionItemsTime,
      order: 5,
    },
    {
      id: uuidv4(),
      name: "Closing Remarks",
      type: "conclusion",
      description: "Summary and next steps",
      duration: closingTime,
      order: 6,
    },
  ];
}

/**
 * Generate a general event layout
 */
function generateGeneralLayout(
  eventTitle: string,
  totalDuration: number
): LayoutSegment[] {
  // Calculate segment durations based on total duration
  const introductionTime = Math.max(5, Math.round(totalDuration * 0.1));
  const mainContentTime = Math.max(30, Math.round(totalDuration * 0.6));
  const qAndATime = Math.max(15, Math.round(totalDuration * 0.2));
  const closingTime = Math.max(5, Math.round(totalDuration * 0.1));

  return [
    {
      id: uuidv4(),
      name: "Welcome and Introduction",
      type: "introduction",
      description: "Opening remarks and welcome",
      duration: introductionTime,
      order: 1,
    },
    {
      id: uuidv4(),
      name: "Main Content",
      type: "main_content",
      description: "Primary event content",
      duration: mainContentTime,
      order: 2,
    },
    {
      id: uuidv4(),
      name: "Q&A Session",
      type: "q_and_a",
      description: "Audience questions and discussion",
      duration: qAndATime,
      order: 3,
    },
    {
      id: uuidv4(),
      name: "Closing Remarks",
      type: "conclusion",
      description: "Summary and thank you",
      duration: closingTime,
      order: 4,
    },
  ];
}

/**
 * Generate appropriate content for a segment based on its type
 */
export function generateContentForSegmentType(
  type: SegmentType,
  name: string,
  eventTitle: string,
  eventType: string,
  duration: number
): string {
  switch (type.toLowerCase() as SegmentType) {
    case "introduction":
      return `Ladies and gentlemen, welcome to ${eventTitle}! [PAUSE=500] I'm your AI host for today, and I'm delighted to guide you through this ${eventType} where we'll explore exciting ideas and foster meaningful connections. [PAUSE=300] We have a packed agenda with valuable content planned for the next ${duration} minutes.`;

    case "keynote":
      return `It's now my pleasure to introduce our keynote presentation. [PAUSE=400] Our distinguished speaker will share insights on industry trends and innovations that are shaping our future. [PAUSE=300] Please join me in welcoming our keynote speaker to the stage. [PAUSE=800]`;

    case "panel":
      return `We now move to our panel discussion featuring industry experts who will share their perspectives on current trends and challenges. [PAUSE=400] I'll be moderating this conversation and will open the floor for questions in the latter part of this ${duration}-minute session.`;

    case "presentation":
      return `Let's now turn our attention to the main presentation of today's ${eventType}. [PAUSE=300] This ${duration}-minute session will cover key insights and practical takeaways that you can implement immediately. [PAUSE=400] Please hold your questions until the Q&A session that follows.`;

    case "q_and_a":
      return `We now have ${duration} minutes for questions and answers. [PAUSE=300] If you have a question, please raise your hand or use the chat function, and I'll do my best to address as many questions as possible. [PAUSE=400] Let's begin with our first question.`;

    case "break":
      return `We'll now take a ${duration}-minute break for refreshments and networking. [PAUSE=300] Please be back in your seats by ${getTimeAfterMinutes(
        duration
      )} so we can continue with our program. [PAUSE=400] Enjoy your break!`;

    case "agenda":
      return `Let me walk you through today's agenda. [PAUSE=300] We have a comprehensive program planned for the next few hours, including presentations, discussions, and interactive sessions. [PAUSE=400] Our event will conclude by ${getTimeAfterMinutes(
        duration * 4
      )}.`;

    case "conclusion":
      return `As we come to the end of ${eventTitle}, I want to thank you all for your active participation and engagement. [PAUSE=400] We hope you found value in today's proceedings and will apply the insights gained. [PAUSE=300] Thank you once again, and we look forward to seeing you at future events!`;

    case "demo":
      return `Now I'll demonstrate how our solution works in practice. [PAUSE=300] This ${duration}-minute demonstration will showcase the key features and benefits that make our offering unique. [PAUSE=400] Feel free to take notes, and there will be time for questions afterward.`;

    case "action_items":
      return `Let's review the action items from today's discussion. [PAUSE=300] I'll assign responsibilities and deadlines to ensure we make progress on these initiatives. [PAUSE=400] Please make note of any tasks assigned to you or your team.`;

    case "main_content":
      return `Let's dive into the main content of our ${eventType}. [PAUSE=300] Over the next ${duration} minutes, we'll explore key concepts and practical applications that are relevant to your work and interests. [PAUSE=400] I encourage you to engage actively with the material presented.`;

    default:
      return `Welcome to the ${name} segment of our ${eventType}. [PAUSE=300] We have allocated ${duration} minutes for this portion of the event. [PAUSE=400] Let's make the most of this time together.`;
  }
}

/**
 * Helper function to calculate time after specified minutes
 */
export function getTimeAfterMinutes(minutes: number): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
