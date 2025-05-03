import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  const body = await request.json();
  const { text } = body;

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  try {
    // Initialize the Gemini client
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GOOGLE_GENERATIVE_AI_API_KEY is not defined in the environment variables"
      );
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert presentation designer specializing in minimalist, text-focused slide decks. Create a beautiful 5-6 slide HTML presentation based on the following text, with these specifications:

STRUCTURE:
Exactly 5-6 slides (no more, no less)
4 concise bullet points per slide (no paragraphs)
Logical flow from slide to slide
Clear hierarchy of information
Navigation arrows as part of each slide's design (left/right)


DESIGN REQUIREMENTS:
NO IMAGES OR VIDEOS - text only, but make it visually stunning through:
Typography:

   - Beautiful, modern font pairings (include Google Fonts)
   - Perfect font sizing hierarchy (title > subtitles > body)
   - Excellent letter spacing and line height

Color Scheme:

   - Sophisticated, harmonious color palette
   - Strong contrast for readability
   - Subtle gradients or accent colors
   - Different background color for each slide

Animations:

   - Smooth, elegant transitions between slides
   - Delightful micro-interactions
   - Subtle entrance animations for bullet points
   - Professional animation timing (not too fast/slow)
   - Smooth hover effects on navigation arrows

Layout:

   - Perfect spacing and alignment
   - Responsive design (works on mobile/desktop)
   - Clean, uncluttered slides
   - Consistent margins and padding
   - Navigation arrows positioned as part of the slide design:
     * Fixed position at both sides of the slide (left/right)
     * Visually integrated with the slide's color scheme
     * Large enough for easy tapping on mobile
     * Subtle visual feedback on hover/tap

Navigation:

   - Keyboard arrow navigation
   - Visible progress indicator
   - Next/previous buttons
   - Arrows should be visible on every slide

TECHNICAL REQUIREMENTS:
Single HTML file with embedded CSS/JS
No external dependencies
Semantic HTML5
Clean, well-commented code
Lightweight animations (prefer CSS over JS)
Arrow navigation implemented with both:

  * Click handlers
  * Keyboard event listeners

DELIVERY FORMAT:
<!DOCTYPE html>
<html>
...
</html>

Text to transform into presentation:
"${text}"

Important:
Only return the complete HTML code with no additional commentary
Navigation arrows must be part of each slide's visual design
Arrows should match the aesthetic of each slide
Ensure arrows remain visible but don't obscure content`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let content = response.text();

    // Clean up the response
    content = content.replace(/```html|```/g, "").trim();

    return NextResponse.json({ html: content });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
