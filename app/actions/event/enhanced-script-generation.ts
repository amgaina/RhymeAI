"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { generateContentForSegmentType } from "./layout/helpers";
import { chunkScriptSegment } from "./script-chunking";

/**
 * Generate enhanced script segments from an event layout
 * This creates more detailed script segments with speaker attribution and multiple segments per layout section
 */
export async function generateEnhancedScriptFromLayout(eventId: string) {
  try {
    // Convert string eventId to number
    const eventIdNum = parseInt(eventId, 10);

    if (isNaN(eventIdNum)) {
      return {
        success: false,
        error: "Invalid event ID format",
      };
    }

    // Get the event with layout from the database
    const event = await db.events.findUnique({
      where: { event_id: eventIdNum },
      select: {
        event_id: true,
        title: true,
        event_type: true,
        description: true,
        voice_settings: true,
        layout: {
          include: {
            segments: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
      };
    }

    // Check if layout exists
    if (
      !event.layout ||
      !event.layout.segments ||
      event.layout.segments.length === 0
    ) {
      return {
        success: false,
        error: "Event layout not found or empty",
      };
    }

    // Delete any existing script segments
    await db.script_segments.deleteMany({
      where: { event_id: eventIdNum },
    });

    // Generate enhanced script content for each layout segment
    const createdSegments = [];
    
    for (const segment of event.layout.segments) {
      // Generate base content for this segment type
      const baseContent = generateContentForSegmentType(
        segment.type as any,
        segment.name,
        event.title,
        event.event_type,
        segment.duration
      );
      
      // Create the main script segment
      const mainSegment = await db.script_segments.create({
        data: {
          event_id: eventIdNum,
          layout_segment_id: segment.id,
          segment_type: segment.type,
          content: baseContent,
          status: "draft",
          timing: segment.duration * 60, // Convert minutes to seconds
          order: segment.order * 10, // Use order*10 to leave room for sub-segments
        },
      });
      
      createdSegments.push(mainSegment);
      
      // For certain segment types, create additional sub-segments
      if (
        segment.type === "keynote" || 
        segment.type === "panel" || 
        segment.type === "presentation" ||
        segment.type === "workshop"
      ) {
        // Create introduction sub-segment
        const introContent = generateSpeakerIntroduction(
          segment.type,
          segment.name,
          event.title
        );
        
        const introSegment = await db.script_segments.create({
          data: {
            event_id: eventIdNum,
            layout_segment_id: segment.id,
            segment_type: `${segment.type}_intro`,
            content: introContent,
            status: "draft",
            timing: Math.round(segment.duration * 0.1) * 60, // 10% of total time
            order: segment.order * 10 + 1, // Order after main segment
          },
        });
        
        createdSegments.push(introSegment);
        
        // Create transition sub-segment
        const transitionContent = generateTransition(
          segment.type,
          segment.name
        );
        
        const transitionSegment = await db.script_segments.create({
          data: {
            event_id: eventIdNum,
            layout_segment_id: segment.id,
            segment_type: `${segment.type}_transition`,
            content: transitionContent,
            status: "draft",
            timing: Math.round(segment.duration * 0.05) * 60, // 5% of total time
            order: segment.order * 10 + 2, // Order after intro segment
          },
        });
        
        createdSegments.push(transitionSegment);
      }
      
      // For Q&A segments, create specific Q&A sub-segments
      if (segment.type === "q_and_a") {
        // Create 3 sample Q&A pairs
        for (let i = 1; i <= 3; i++) {
          const qaContent = generateQandAPair(
            event.event_type,
            segment.name,
            i
          );
          
          const qaSegment = await db.script_segments.create({
            data: {
              event_id: eventIdNum,
              layout_segment_id: segment.id,
              segment_type: `q_and_a_pair`,
              content: qaContent,
              status: "draft",
              timing: Math.round(segment.duration * 0.2) * 60, // 20% of total time per pair
              order: segment.order * 10 + i, // Order after main segment
            },
          });
          
          createdSegments.push(qaSegment);
        }
      }
    }

    // Chunk all script segments for better TTS generation
    const chunkingResults = await Promise.all(
      createdSegments.map(async (segment) => {
        return chunkScriptSegment(segment.id, 50); // Target 50 words per chunk
      })
    );

    // Update the event status
    await db.events.update({
      where: { event_id: eventIdNum },
      data: {
        status: "script_ready",
        updated_at: new Date(),
      },
    });

    // Revalidate paths
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/event-creation?eventId=${eventId}`);
    revalidatePath(`/event/${eventId}`);
    revalidatePath(`/event/${eventId}/script`);

    return {
      success: true,
      segments: createdSegments,
      chunkingResults,
      message: "Enhanced script generated from layout successfully",
    };
  } catch (error) {
    console.error("Error generating enhanced script:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate enhanced script",
    };
  }
}

/**
 * Generate a speaker introduction for a segment
 */
function generateSpeakerIntroduction(
  segmentType: string,
  segmentName: string,
  eventTitle: string
): string {
  switch (segmentType.toLowerCase()) {
    case "keynote":
      return `[PAUSE=500] It's now my pleasure to introduce our keynote speaker for ${segmentName}. [PAUSE=300] Our speaker today is a distinguished expert in the field and will be sharing valuable insights on topics central to ${eventTitle}. [BREATHE] Please join me in welcoming our keynote speaker to the stage. [PAUSE=800]`;
    
    case "panel":
      return `[PAUSE=500] I'd like to welcome our esteemed panelists for the ${segmentName} discussion. [PAUSE=300] Each brings unique expertise and perspective to our conversation today. [BREATHE] I'll be moderating this discussion and guiding us through several key topics. [PAUSE=400] Let's begin by having each panelist briefly introduce themselves. [PAUSE=800]`;
    
    case "presentation":
      return `[PAUSE=500] Next on our agenda is a presentation on ${segmentName}. [PAUSE=300] This presentation will cover key aspects that are fundamental to understanding the broader context of our event. [BREATHE] Please direct your attention to the screen as we begin. [PAUSE=400]`;
    
    case "workshop":
      return `[PAUSE=500] Welcome to our workshop session on ${segmentName}. [PAUSE=300] During this interactive segment, we'll be exploring practical applications and hands-on techniques. [BREATHE] I encourage everyone to actively participate and ask questions throughout. [PAUSE=400] Let's start by outlining our objectives for this workshop. [PAUSE=300]`;
    
    default:
      return `[PAUSE=500] Let me introduce the next segment of our program: ${segmentName}. [PAUSE=300] This is an important part of our event where we'll focus on key information and insights. [BREATHE] I'm looking forward to guiding you through this section. [PAUSE=400]`;
  }
}

/**
 * Generate a transition between segments
 */
function generateTransition(segmentType: string, segmentName: string): string {
  switch (segmentType.toLowerCase()) {
    case "keynote":
      return `[PAUSE=500] Thank you for that insightful keynote presentation. [PAUSE=300] The perspectives shared will certainly give us much to think about as we continue with our event. [BREATHE] Let's show our appreciation once more with a round of applause. [PAUSE=800]`;
    
    case "panel":
      return `[PAUSE=500] That concludes our panel discussion on ${segmentName}. [PAUSE=300] I'd like to thank all of our panelists for their valuable contributions and insights. [BREATHE] The diverse perspectives shared today have enriched our understanding of the topic. [PAUSE=400]`;
    
    case "presentation":
      return `[PAUSE=500] That brings us to the end of the presentation on ${segmentName}. [PAUSE=300] I hope you found the information valuable and applicable to your work. [BREATHE] We'll now transition to our next segment. [PAUSE=400]`;
    
    case "workshop":
      return `[PAUSE=500] We've now completed the workshop on ${segmentName}. [PAUSE=300] Thank you all for your active participation and engagement. [BREATHE] The skills practiced here today should serve you well in your future endeavors. [PAUSE=400]`;
    
    default:
      return `[PAUSE=500] That concludes our ${segmentName} segment. [PAUSE=300] Thank you for your attention and engagement. [BREATHE] We'll now move on to the next part of our program. [PAUSE=400]`;
  }
}

/**
 * Generate a Q&A pair for Q&A segments
 */
function generateQandAPair(
  eventType: string,
  segmentName: string,
  questionNumber: number
): string {
  // Different questions based on question number
  let question = "";
  let answer = "";
  
  switch (questionNumber) {
    case 1:
      question = `What are the key takeaways from today's ${eventType}?`;
      answer = `That's an excellent question. [PAUSE=300] The main takeaways from today's event include a deeper understanding of the core concepts we've discussed, practical strategies that you can implement immediately, and new perspectives on challenges in the field. [BREATHE] Additionally, the networking opportunities and connections made today should prove valuable for future collaboration.`;
      break;
    
    case 2:
      question = `How can we apply these concepts in a real-world setting?`;
      answer = `Applying these concepts in the real world involves several steps. [PAUSE=300] First, identify specific areas in your work where these principles are most relevant. [PAUSE=200] Second, start with small implementations to test effectiveness. [BREATHE] Third, gather feedback and iterate on your approach. [PAUSE=300] Many of our participants have found success by forming implementation teams to support each other through the process.`;
      break;
    
    case 3:
      question = `What resources do you recommend for further learning on this topic?`;
      answer = `For those interested in exploring this topic further, I recommend several resources. [PAUSE=300] There are excellent books by industry experts that dive deeper into the concepts we've covered today. [PAUSE=200] Additionally, there are online courses, webinars, and community forums where practitioners share their experiences. [BREATHE] We'll be sending a follow-up email with links to these resources, so you'll have them for reference.`;
      break;
    
    default:
      question = `Can you elaborate more on the ${segmentName} discussion?`;
      answer = `I'd be happy to elaborate on our ${segmentName} discussion. [PAUSE=300] The key point to understand is how this fits into the broader context of our field. [PAUSE=200] What we've found is that successful implementation requires both technical understanding and strategic application. [BREATHE] Does that address your question, or would you like me to go into more specific aspects?`;
  }
  
  return `[EMPHASIS] Question ${questionNumber}: [PAUSE=300] "${question}" [PAUSE=500] [BREATHE] Answer: [PAUSE=300] ${answer} [PAUSE=800]`;
}
