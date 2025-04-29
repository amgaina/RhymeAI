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
      return `Ladies and gentlemen, welcome to ${eventTitle}! [PAUSE=500] I'm your emcee for today, and I'm delighted to guide you through this ${eventType} where we'll explore exciting ideas and foster meaningful connections. [PAUSE=300]

We have a packed agenda with valuable content planned for the next ${duration} minutes. [PAUSE=400] Before we begin, I'd like to take a moment to thank everyone who made this event possible, including our sponsors, organizers, and all of you for taking the time to join us today. [PAUSE=500]

This ${eventType} brings together experts and enthusiasts from across the industry to share knowledge, insights, and best practices. [PAUSE=300] Throughout the day, you'll have opportunities to learn, network, and engage with the content in meaningful ways. [PAUSE=400]

I encourage you to participate actively, ask questions, and make the most of this experience. [PAUSE=300] Let's make this a truly interactive and enriching event for everyone involved. [PAUSE=500]

Now, let me briefly outline what you can expect today. [PAUSE=300] We'll begin with an overview of the key topics, followed by in-depth presentations from our speakers. [PAUSE=400] There will be breaks scheduled throughout the day to give you time to network and refresh. [PAUSE=300] And we'll conclude with a comprehensive Q&A session to address any questions you might have.`;

    case "keynote":
      return `It's now my pleasure to introduce our keynote presentation. [PAUSE=400] Our distinguished speaker will share insights on industry trends and innovations that are shaping our future. [PAUSE=300]

With extensive experience in the field and a reputation for thought leadership, our keynote speaker brings a unique perspective that I'm sure you'll find both enlightening and inspiring. [PAUSE=400]

The presentation will cover key developments in the industry, emerging trends, and practical strategies that you can implement in your own work. [PAUSE=300] I encourage you to take notes and consider how these insights might apply to your specific context. [PAUSE=500]

Following the presentation, there will be time for questions, so please start thinking about what you'd like to ask. [PAUSE=300] Without further delay, please join me in welcoming our keynote speaker to the stage. [PAUSE=800]

[PAUSE=1000] Thank you for that insightful presentation. [PAUSE=300] The perspectives you've shared give us much to think about and apply in our own work. [PAUSE=400] I particularly appreciated your points about innovation and adaptation in today's rapidly changing landscape. [PAUSE=500]

Before we move on to our next segment, I'd like to invite the audience to show their appreciation once more for our keynote speaker. [PAUSE=800]`;

    case "panel":
      return `We now move to our panel discussion featuring industry experts who will share their perspectives on current trends and challenges. [PAUSE=400] I'll be moderating this conversation and will open the floor for questions in the latter part of this ${duration}-minute session. [PAUSE=300]

Our distinguished panelists bring diverse backgrounds and expertise to this discussion. [PAUSE=400] Each has made significant contributions to their respective fields and offers unique insights into the topics we'll be exploring today. [PAUSE=500]

During this session, we'll address several key questions: [PAUSE=300]
- What are the most significant challenges facing our industry today?
- How are emerging technologies transforming traditional practices?
- What strategies have proven most effective in navigating recent changes?
- What future developments should we be preparing for?

[PAUSE=400] I'll guide our panelists through these questions, but I encourage you to think about what you'd like to ask during the Q&A portion. [PAUSE=300] Your engagement will enrich this discussion and ensure it addresses the issues most relevant to you. [PAUSE=500]

Now, let me introduce our panelists. [PAUSE=300] Each will give a brief introduction before we dive into our main discussion topics. [PAUSE=400]`;

    case "presentation":
      return `Let's now turn our attention to the main presentation of today's ${eventType}. [PAUSE=300] This ${duration}-minute session will cover key insights and practical takeaways that you can implement immediately. [PAUSE=400]

The content we're about to explore represents cutting-edge thinking in our field and has been carefully curated to provide maximum value in the time we have available. [PAUSE=500]

I encourage you to engage actively with the material, taking notes and considering how these concepts apply to your specific context. [PAUSE=300] The most valuable insights often come from connecting new ideas to your existing knowledge and experience. [PAUSE=400]

During the presentation, we'll explore several key themes:
- The current state of the industry and emerging trends
- Innovative approaches to common challenges
- Case studies demonstrating successful implementation
- Practical strategies you can apply in your own work

[PAUSE=300] Please hold your questions until the Q&A session that follows, where we'll have dedicated time to address your specific inquiries. [PAUSE=400] This will allow us to cover all the material comprehensively before opening up for discussion. [PAUSE=500]

Without further delay, let's begin our exploration of these important topics. [PAUSE=300]`;

    case "q_and_a":
      return `We now have ${duration} minutes for questions and answers. [PAUSE=300] This is your opportunity to engage directly with our speakers and panelists, seeking clarification or deeper insights on the topics we've covered. [PAUSE=400]

If you have a question, please raise your hand or use the chat function, and I'll do my best to address as many questions as possible. [PAUSE=300] When called upon, please state your name and affiliation before asking your question. [PAUSE=400] This helps our speakers contextualize their responses and facilitates networking opportunities. [PAUSE=500]

I encourage questions that build on the content we've covered today and that might benefit the broader audience. [PAUSE=300] While specific technical questions are welcome, very detailed or highly specialized inquiries might be better addressed in one-on-one conversations during the networking session. [PAUSE=400]

Let's begin with our first question. [PAUSE=300] Who would like to start? [PAUSE=500]

[PAUSE=800] Thank you for that excellent question. [PAUSE=300] I'll direct that to our panel - who would like to address this first? [PAUSE=500]

[PAUSE=1000] That's a fascinating perspective. [PAUSE=300] Does anyone else on the panel have something to add? [PAUSE=500]

[PAUSE=800] Let's take another question from the audience. [PAUSE=300]`;

    case "break":
      return `We'll now take a ${duration}-minute break for refreshments and networking. [PAUSE=300] This is an excellent opportunity to connect with fellow attendees, exchange ideas, and reflect on the content we've covered so far. [PAUSE=400]

Refreshments are available in the designated area, and I encourage you to use this time to introduce yourself to someone new. [PAUSE=300] Some of the most valuable connections at events like this happen during these informal interactions. [PAUSE=500]

If you have specific questions for our speakers or panelists, they will be available near the stage area during the break. [PAUSE=400] This is a great chance for more personalized discussions that we couldn't accommodate during the formal Q&A. [PAUSE=300]

Please be back in your seats by ${getTimeAfterMinutes(
        duration
      )} so we can continue with our program on schedule. [PAUSE=400] We have more valuable content planned for the next session, and we want to ensure everyone can benefit fully. [PAUSE=500]

Enjoy your break, and I look forward to reconvening shortly! [PAUSE=300]`;

    case "agenda":
      return `Let me walk you through today's agenda so you know what to expect from our ${eventType}. [PAUSE=300] We have a comprehensive program planned for the next few hours, including presentations, discussions, and interactive sessions. [PAUSE=400]

Our event is structured to provide a logical flow of information, building from foundational concepts to more advanced applications. [PAUSE=300] This progressive approach ensures that everyone, regardless of prior knowledge, can follow along and gain valuable insights. [PAUSE=500]

Here's our schedule for today:

First, we'll begin with introductions and an overview of key themes, which will take approximately ${Math.round(
        duration * 0.2
      )} minutes. [PAUSE=300]

Next, we'll move into our main content sessions, where our experts will present in-depth material on core topics. [PAUSE=400] This portion will last about ${Math.round(
        duration * 0.5
      )} minutes and represents the heart of our program. [PAUSE=300]

Following that, we'll have a structured discussion and Q&A session lasting approximately ${Math.round(
        duration * 0.2
      )} minutes, where you can engage directly with our presenters. [PAUSE=500]

Finally, we'll conclude with a summary of key takeaways and next steps, taking about ${Math.round(
        duration * 0.1
      )} minutes. [PAUSE=300]

Our event will conclude by ${getTimeAfterMinutes(
        duration * 4
      )}, at which point there will be additional time for networking and informal discussions. [PAUSE=400]

Throughout the day, we encourage your active participation. [PAUSE=300] Your questions and insights enrich the experience for everyone present. [PAUSE=500]`;

    case "conclusion":
      return `As we come to the end of ${eventTitle}, I want to take a moment to reflect on what we've accomplished together. [PAUSE=400] Throughout this ${eventType}, we've explored important concepts, shared valuable insights, and engaged in meaningful discussions that I hope will continue beyond today. [PAUSE=500]

I want to express my sincere gratitude to everyone who contributed to making this event a success. [PAUSE=300] To our speakers and panelists, thank you for sharing your expertise and insights with such clarity and generosity. [PAUSE=400] Your contributions have enriched our understanding and provided valuable perspectives that we can all apply in our work. [PAUSE=500]

To our attendees, thank you for your active participation and engagement. [PAUSE=300] Your thoughtful questions and comments have added depth to our discussions and created a truly collaborative learning environment. [PAUSE=400]

I also want to acknowledge the behind-the-scenes team who made this event possible - the organizers, technical support, and venue staff whose efforts often go unnoticed but are essential to our success. [PAUSE=500]

As you leave today, I encourage you to reflect on what you've learned and consider how you might apply these insights in your own context. [PAUSE=300] The true value of an event like this lies not just in the knowledge shared, but in how that knowledge transforms our practice. [PAUSE=400]

We hope you found value in today's proceedings and will apply the insights gained. [PAUSE=300] Thank you once again for your participation, and we look forward to seeing you at future events! [PAUSE=500]

Safe travels home, and best wishes for your continued success. [PAUSE=300]`;

    case "demo":
      return `Now I'll demonstrate how our solution works in practice. [PAUSE=300] This ${duration}-minute demonstration will showcase the key features and benefits that make our offering unique. [PAUSE=400]

What you're about to see represents the culmination of extensive research, development, and refinement based on real-world user feedback. [PAUSE=300] Our goal is to show not just what our solution does, but how it can address specific challenges you might be facing in your own work. [PAUSE=500]

During this demonstration, I'll walk through several key scenarios:
- First, I'll show the basic setup and configuration process
- Next, we'll explore the core functionality and how it addresses common use cases
- Then, I'll demonstrate some advanced features that set our solution apart
- Finally, I'll show how everything integrates into existing workflows

[PAUSE=400] Feel free to take notes, and there will be time for questions afterward. [PAUSE=300] If you see something particularly relevant to your needs, make a note so we can discuss it in more detail during the Q&A. [PAUSE=500]

Let's begin with an overview of the interface and basic navigation... [PAUSE=300]`;

    case "action_items":
      return `Let's review the action items from today's discussion to ensure we have clear next steps and accountability. [PAUSE=300] Capturing these commitments is essential for turning our valuable conversation into tangible outcomes. [PAUSE=400]

I'll assign responsibilities and deadlines to ensure we make progress on these initiatives. [PAUSE=300] As I go through each item, please make note of any tasks assigned to you or your team. [PAUSE=500]

For each action item, I'll specify:
- What needs to be done
- Who is responsible for completing it
- When it should be completed
- How progress will be measured
- Who should be informed upon completion

[PAUSE=400] If anything is unclear or if you have concerns about your assigned tasks, please speak up now so we can address any issues before concluding. [PAUSE=300] It's important that everyone leaves with a clear understanding of their responsibilities. [PAUSE=500]

Let's begin with our first action item... [PAUSE=300]`;

    case "main_content":
      return `Let's dive into the main content of our ${eventType}. [PAUSE=300] Over the next ${duration} minutes, we'll explore key concepts and practical applications that are relevant to your work and interests. [PAUSE=400]

This section represents the core of our program and has been carefully designed to provide maximum value in the time we have available. [PAUSE=300] The content builds progressively, starting with foundational concepts and moving toward more advanced applications. [PAUSE=500]

Throughout this session, we'll cover several important themes:
- The historical context and evolution of key ideas in our field
- Current best practices and their practical implementation
- Emerging trends and how they might shape future developments
- Case studies demonstrating successful approaches in real-world scenarios

[PAUSE=400] I encourage you to engage actively with the material presented. [PAUSE=300] Consider how these concepts relate to your specific context and challenges. [PAUSE=400] The most valuable insights often come from connecting new information to your existing knowledge and experience. [PAUSE=500]

Feel free to take notes, and remember that we'll have a dedicated Q&A session following this presentation where you can seek clarification or deeper exploration of specific points. [PAUSE=300]

Now, let's begin our exploration of these important topics... [PAUSE=400]`;

    default:
      return `Welcome to the ${name} segment of our ${eventType}. [PAUSE=300] This is an important part of our program where we'll focus on ${name.toLowerCase()}. [PAUSE=400]

We have allocated ${duration} minutes for this portion of the event, which gives us ample time to explore the topic in depth while maintaining our overall schedule. [PAUSE=500]

During this segment, we'll cover several key aspects:
- The fundamental principles underlying ${name.toLowerCase()}
- Practical applications and real-world examples
- Common challenges and effective solutions
- Future directions and emerging opportunities

[PAUSE=300] I encourage you to engage actively with this content, considering how it relates to your own work and interests. [PAUSE=400] Your perspective and questions will enrich our collective understanding. [PAUSE=500]

Let's make the most of this time together by focusing our attention and participating fully in the discussion. [PAUSE=300]`;
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

/**
 * Calculate start and end times for each segment based on a start time
 * @param segments The layout segments
 * @param startTime The event start time
 * @returns The segments with calculated start and end times
 */
export function calculateSegmentTimes(
  segments: LayoutSegment[],
  startTime: Date
): LayoutSegment[] {
  let currentTime = new Date(startTime);

  // Sort segments by order
  const sortedSegments = [...segments].sort((a, b) => a.order - b.order);

  // Format time function
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Calculate times for each segment
  return sortedSegments.map((segment) => {
    const segmentStartTime = formatTime(currentTime);

    // Calculate end time
    const endTime = new Date(currentTime);
    endTime.setMinutes(endTime.getMinutes() + segment.duration);
    const segmentEndTime = formatTime(endTime);

    // Update current time for next segment
    currentTime = new Date(endTime);

    return {
      ...segment,
      startTime: segmentStartTime,
      endTime: segmentEndTime,
    };
  });
}
