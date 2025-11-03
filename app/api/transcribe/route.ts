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
    const formData = await request.formData()
    const audioFile = formData.get("audio") as Blob

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Convert audio to base64 for OpenAI Whisper
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Transcribe audio using OpenAI Whisper
    const transcriptionResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: (() => {
        const formData = new FormData()
        formData.append("file", new Blob([buffer], { type: "audio/webm" }), "audio.webm")
        formData.append("model", "whisper-1")
        return formData
      })(),
    })

    if (!transcriptionResponse.ok) {
      throw new Error("Transcription failed")
    }

    const { text: transcript } = await transcriptionResponse.json()

    const { object: summary } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: summarySchema,
      prompt: `Analyze this meeting transcript and extract key information:

Transcript:
${transcript}`,
    })

    return NextResponse.json({
      transcript,
      summary,
    })
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json({ error: "Failed to process audio" }, { status: 500 })
  }
}
