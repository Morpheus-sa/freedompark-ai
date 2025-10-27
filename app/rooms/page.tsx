import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NavHeader } from "@/components/nav-header"
import Link from "next/link"
import { Plus, Users, Clock } from "lucide-react"

export default async function RoomsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()

  // Fetch user's meetings
  const { data: meetings } = await supabase
    .from("meetings")
    .select(
      `
      *,
      participants(count)
    `,
    )
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <NavHeader userEmail={user.email} displayName={profile?.display_name} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Meeting Rooms</h1>
            <p className="mt-2 text-muted-foreground">Create or join collaborative meeting rooms</p>
          </div>
          <Button asChild>
            <Link href="/rooms/new">
              <Plus className="mr-2 h-4 w-4" />
              New Room
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {meetings && meetings.length > 0 ? (
            meetings.map((meeting) => (
              <Link key={meeting.id} href={`/rooms/${meeting.id}`}>
                <Card className="transition-colors hover:bg-accent">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{meeting.title}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {meeting.participants?.[0]?.count || 0} participants
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(meeting.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          meeting.status === "active"
                            ? "bg-green-500"
                            : meeting.status === "waiting"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                        }`}
                      />
                      <span className="text-sm capitalize text-muted-foreground">{meeting.status}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="mb-4 text-muted-foreground">No meeting rooms yet</p>
                <Button asChild>
                  <Link href="/rooms/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Room
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
