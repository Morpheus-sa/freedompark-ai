"use client"

import { Button } from "@/components/ui/button"
import { Mic, Sparkles, Users } from "lucide-react"
import { useEffect, useRef } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

export function LandingHero({ onGetStarted }: { onGetStarted: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Animated microphone particles
    const particles: Array<{
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
    }> = []

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      })
    }

    // Animation loop
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw particles
      particles.forEach((particle) => {
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139, 92, 246, ${particle.opacity})`
        ctx.fill()

        // Update position
        particle.x += particle.speedX
        particle.y += particle.speedY

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0
      })

      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-violet-950/20 dark:to-violet-950/20">
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-40" />

      {/* Floating microphone animation */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="animate-float">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-violet-500/20 blur-3xl" />
            <Mic className="relative h-32 w-32 text-violet-500/30 sm:h-48 sm:w-48" strokeWidth={1} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-6 sm:px-12">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600">
              <Mic className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">MeetingAI</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={onGetStarted}>
              Sign in
            </Button>
          </div>
        </header>

        {/* Hero content */}
        <div className="flex flex-1 items-center justify-center px-6 pb-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
              <Sparkles className="h-4 w-4" />
              <span>Powered by AI</span>
            </div>

            <h1 className="mb-6 text-balance text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Transform meetings into
              <span className="bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">
                {" "}
                actionable insights
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Real-time transcription, AI-powered summaries, and collaborative note-taking. Never miss a detail in your
              meetings again.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="h-12 bg-violet-600 px-8 text-base hover:bg-violet-700"
              >
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-transparent">
                Watch Demo
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="mt-16 grid gap-6 sm:grid-cols-3">
              <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
                  <Mic className="h-6 w-6 text-violet-500" />
                </div>
                <h3 className="mb-2 font-semibold">Real-time Transcription</h3>
                <p className="text-sm text-muted-foreground">Automatic speech-to-text with speaker identification</p>
              </div>

              <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
                  <Sparkles className="h-6 w-6 text-violet-500" />
                </div>
                <h3 className="mb-2 font-semibold">AI Summaries</h3>
                <p className="text-sm text-muted-foreground">Get key points, action items, and decisions instantly</p>
              </div>

              <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
                  <Users className="h-6 w-6 text-violet-500" />
                </div>
                <h3 className="mb-2 font-semibold">Collaborative</h3>
                <p className="text-sm text-muted-foreground">Multiple participants, real-time sync across devices</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
