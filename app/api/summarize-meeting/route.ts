import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"

const summarySchema = z.object({
  overview: z.string().describe("A brief overview of the meeting"),
  keyPoints: z.array(z.string()).describe("Main points discussed in the meeting"),
  actionItems: z.array(z.string()).describe("Action items and tasks identified"),
  decisions: z.array(z.string()).describe("Key decisions made during the meeting"),
  speakerContributions: z
    .array(
      z.object({
        speaker: z.string().describe("Name of the speaker"),
        contribution: z.string().describe("Summary of what this speaker contributed"),
      }),
    )
    .describe("Summary of each speaker's main contributions"),
})

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting meeting summarization")
    const { transcript } = await request.json()

    if (!transcript || transcript.length === 0) {
      console.log("[v0] No transcript provided")
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 })
    }

    console.log("[v0] Transcript segments:", transcript.length)
    const formattedTranscript = transcript.map((segment: any) => `${segment.speakerName}: ${segment.text}`).join("\n\n")

    console.log("[v0] Calling generateObject with schema")
    const { object: summary } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: summarySchema,
      prompt: `Analyze this meeting transcript and provide a comprehensive summary. Pay special attention to who said what and each person's contributions.

Transcript:
${formattedTranscript}

Generate a detailed summary with:
- A brief overview of the meeting
- Key points discussed (as an array of strings)
- Action items identified (as an array of strings)
- Decisions made (as an array of strings)
- Speaker contributions (as an array of objects with speaker name and their contribution summary)`,
    })

    console.log("[v0] Summary generated successfully")
    return NextResponse.json(summary)
  } catch (error: any) {
    console.error("[v0] Summarization error:", error.message)
    console.error("[v0] Full error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate summary" }, { status: 500 })
  }
}
