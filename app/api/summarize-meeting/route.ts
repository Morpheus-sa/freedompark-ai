import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"

const summarySchema = z.object({
  overview: z.string().describe("A brief overview of the meeting"),
  keyPoints: z.array(z.string()).describe("Main points discussed in the meeting"),
  actionItems: z.array(z.string()).describe("Action items and tasks identified"),
  decisions: z.array(z.string()).describe("Key decisions made during the meeting"),
  speakerContributions: z
    .record(z.string())
    .describe("Summary of each speaker's main contributions, keyed by speaker name"),
})

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json()

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 })
    }

    const formattedTranscript = transcript.map((segment: any) => `${segment.speakerName}: ${segment.text}`).join("\n\n")

    const { object: summary } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: summarySchema,
      prompt: `Analyze this meeting transcript and provide a comprehensive summary. Pay special attention to who said what and each person's contributions.

Transcript:
${formattedTranscript}

Generate a detailed summary including overview, key points, action items, decisions, and individual speaker contributions.`,
    })

    return NextResponse.json(summary)
  } catch (error: any) {
    console.error("[v0] Summarization error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate summary" }, { status: 500 })
  }
}
