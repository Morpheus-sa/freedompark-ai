import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"

const summarySchema = z.object({
  overview: z.string().describe("A brief 2-3 sentence overview of the meeting"),
  keyPoints: z.array(z.string()).describe("Main discussion points from the meeting"),
  actionItems: z.array(z.string()).describe("Tasks or action items mentioned"),
  decisions: z.array(z.string()).describe("Decisions made during the meeting"),
})

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 })
    }

    // Generate AI summary using the AI SDK
    const { object: summary } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: summarySchema,
      prompt: `Analyze this meeting transcript and extract key information:

Transcript:
${transcript}

Please provide a comprehensive summary with overview, key points, action items, and decisions made.`,
    })

    return NextResponse.json({
      summary,
    })
  } catch (error) {
    console.error("[v0] Summarization error:", error)
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}
