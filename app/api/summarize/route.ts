import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"

const summarySchema = z.object({
  overview: z.string().describe("A brief 2-3 sentence overview of the meeting"),
  keyPoints: z.array(z.string()).describe("Main discussion points from the meeting"),
  actionItems: z.array(z.string()).describe("Tasks or action items mentioned"),
  decisions: z.array(z.string()).describe("Decisions made during the meeting"),
  speakerInsights: z
    .array(
      z.object({
        speaker: z.string(),
        contribution: z.string().describe("Summary of this speaker's main contributions and points"),
      }),
    )
    .optional()
    .describe("Individual speaker contributions and insights"),
})

export async function POST(request: NextRequest) {
  try {
    const { transcript, segments, speakers } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 })
    }

    let formattedTranscript = transcript
    if (segments && segments.length > 0) {
      formattedTranscript = segments.map((seg: any) => `${seg.speaker}: ${seg.text}`).join("\n\n")
    }

    const prompt =
      segments && speakers
        ? `Analyze this meeting transcript with multiple speakers and extract key information:

Transcript:
${formattedTranscript}

Speakers in the meeting: ${speakers.join(", ")}

Please provide a comprehensive summary with:
1. Overview of the meeting
2. Key points discussed
3. Action items mentioned
4. Decisions made
5. Individual speaker contributions (what each person contributed to the discussion)

Pay special attention to who said what and provide insights about each speaker's role and contributions.`
        : `Analyze this meeting transcript and extract key information:

Transcript:
${transcript}

Please provide a comprehensive summary with overview, key points, action items, and decisions made.`

    // Generate AI summary using the AI SDK
    const { object: summary } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: summarySchema,
      prompt,
    })

    return NextResponse.json({
      summary,
    })
  } catch (error) {
    console.error("Summarization error:", error)
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}
