"use client";

import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mic,
  MicOff,
  Users,
  Check,
  Sparkles,
  Crown,
  AlertCircle,
  UserPlus,
  Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ParticipantListPanel } from "@/components/participant-list-panel";
import {
  LanguageSelector,
  SUPPORTED_LANGUAGES,
} from "@/components/language-selector";
import { AddParticipantsDialog } from "@/components/add-participants-dialog";
import { sendNotification } from "@/lib/notification-service";
import type { Meeting, TranscriptSegment } from "@/types/meeting";

interface CollaborativeMeetingRecorderProps {
  meetingId: string;
  onEndMeeting: () => void;
}

export function CollaborativeMeetingRecorder({
  meetingId,
  onEndMeeting,
}: CollaborativeMeetingRecorderProps) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [copied, setCopied] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en-ZA");
  const [addParticipantsOpen, setAddParticipantsOpen] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const isHost = user?.uid === meeting?.createdBy;
  const isMuted = meeting?.mutedParticipants?.includes(user?.uid || "");

  useEffect(() => {
    const meetingRef = doc(db, "meetings", meetingId);
    const unsubscribe = onSnapshot(meetingRef, (snapshot) => {
      if (snapshot.exists()) {
        setMeeting({ id: snapshot.id, ...snapshot.data() } as Meeting);
      }
    });

    return unsubscribe;
  }, [meetingId]);

  useEffect(() => {
    if (isMuted && isRecording) {
      stopRecording();
      toast({
        title: "You've been muted",
        description: "The host has muted your microphone",
        variant: "destructive",
      });
    }
  }, [isMuted]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Not supported",
        description: "Speech recognition is not supported in this browser",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage;

    recognition.onresult = async (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      if (final && user) {
        const segment: TranscriptSegment = {
          id: Date.now().toString(),
          speakerId: user.uid,
          speakerName: user.displayName,
          text: final,
          timestamp: Date.now(),
        };

        try {
          const meetingRef = doc(db, "meetings", meetingId);
          await updateDoc(meetingRef, {
            transcript: arrayUnion(segment),
          });
        } catch (error) {
          console.error("Error saving transcript:", error);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        return;
      }
      toast({
        title: "Recognition error",
        description: event.error,
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [meetingId, user, toast, selectedLanguage]);

  useEffect(() => {
    if (user?.preferredLanguage) {
      setSelectedLanguage(user.preferredLanguage);
    } else if (meeting?.language) {
      setSelectedLanguage(meeting.language);
    }
  }, [user, meeting]);

  const startRecording = () => {
    if (isMuted) {
      toast({
        title: "You are muted",
        description: "The host has muted your microphone",
        variant: "destructive",
      });
      return;
    }

    if (!recognitionRef.current) return;

    try {
      isRecordingRef.current = true;
      setIsRecording(true);
      recognitionRef.current.start();
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;

    isRecordingRef.current = false;
    setIsRecording(false);
    recognitionRef.current.stop();
    setInterimTranscript("");
    toast({
      title: "Recording stopped",
      description: "Your transcript has been saved",
    });
  };

  const shareMeeting = async () => {
    if (!meeting) return;

    const shareText = meeting.shareCode
      ? `Join my meeting: ${meeting.title}\n\nCode: ${meeting.shareCode}\nID: ${meetingId}`
      : `Join my meeting: ${meeting.title}\n\nMeeting ID: ${meetingId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: meeting.title,
          text: shareText,
        });
        toast({
          title: "Meeting shared",
          description: "Share details sent successfully",
        });
        return;
      } catch (error) {
        console.log(" Native share cancelled or failed");
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: meeting.shareCode
          ? `Meeting code ${meeting.shareCode} and ID copied`
          : "Meeting ID copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const generateSummary = async () => {
    if (!meeting || meeting.transcript.length === 0) {
      toast({
        title: "No transcript",
        description: "Record some content before generating a summary",
        variant: "destructive",
      });
      return;
    }

    setSummarizing(true);
    try {
      const response = await fetch("/api/summarize-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: meeting.transcript }),
      });

      if (!response.ok) throw new Error("Failed to generate summary");

      const summary = await response.json();

      const meetingRef = doc(db, "meetings", meetingId);
      await updateDoc(meetingRef, { summary });

      toast({
        title: "Summary generated",
        description: "AI summary has been added to the meeting",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate summary",
        variant: "destructive",
      });
    } finally {
      setSummarizing(false);
    }
  };

  const endMeeting = async () => {
    if (!isHost) {
      toast({
        title: "Permission denied",
        description: "Only the host can end the meeting",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      stopRecording();
    }

    try {
      const meetingRef = doc(db, "meetings", meetingId);
      await updateDoc(meetingRef, {
        isActive: false,
      });

      if (meeting) {
        const notificationPromises = meeting.participants
          .filter((participantId) => participantId !== user?.uid)
          .map((participantId) =>
            sendNotification(
              participantId,
              "meeting_ended",
              "Meeting Ended",
              `"${meeting.title}" has ended. View the transcript and summary in Past Meetings.`,
              {
                meetingId: meeting.id,
                meetingTitle: meeting.title,
              }
            )
          );

        await Promise.all(notificationPromises);
      }

      toast({
        title: "Meeting ended",
        description: "All participants have been notified",
      });
      onEndMeeting();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to end meeting",
        variant: "destructive",
      });
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    if (isRecording) {
      stopRecording();
      toast({
        title: "Language changed",
        description:
          "Recording stopped. Start recording again with the new language.",
      });
    }

    setSelectedLanguage(languageCode);

    if (isHost && meeting) {
      try {
        const meetingRef = doc(db, "meetings", meetingId);
        await updateDoc(meetingRef, {
          language: languageCode,
        });
      } catch (error) {
        console.error("Error updating meeting language:", error);
      }
    }

    toast({
      title: "Language updated",
      description: `Transcription language set to ${
        SUPPORTED_LANGUAGES.find((l) => l.code === languageCode)?.name
      }`,
    });
  };

  if (!meeting) {
    return <div>Loading meeting...</div>;
  }

  const uniqueSpeakers = Array.from(
    new Set(meeting.transcript.map((s) => s.speakerName))
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle>{meeting.title}</CardTitle>
                  {isHost && (
                    <Badge variant="default" className="gap-1">
                      <Crown className="h-3 w-3" />
                      Host
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  {meeting.participants.length} participant
                  {meeting.participants.length !== 1 ? "s" : ""}
                  {uniqueSpeakers.length > 0 &&
                    ` • ${uniqueSpeakers.length} speaker${
                      uniqueSpeakers.length !== 1 ? "s" : ""
                    }`}
                </CardDescription>
                {meeting.shareCode && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      Code: {meeting.shareCode}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={shareMeeting}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  <span className="ml-2">Share</span>
                </Button>
                {(isHost || user?.isAdmin) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddParticipantsOpen(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="ml-2">Add</span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isMuted && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have been muted by the host. You cannot record audio until
                  unmuted.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
              <span className="text-sm font-medium">
                Transcription Language:
              </span>
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
                disabled={isRecording}
                variant="badge"
              />
            </div>

            <div className="flex gap-2">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="flex-1"
                  disabled={isMuted}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="flex-1"
                >
                  <MicOff className="mr-2 h-4 w-4" />
                  Stop Recording
                </Button>
              )}
              <Button
                onClick={generateSummary}
                variant="outline"
                disabled={summarizing || meeting.transcript.length === 0}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {summarizing ? "Generating..." : "Summarize"}
              </Button>
              {isHost && (
                <Button onClick={endMeeting} variant="outline">
                  End Meeting
                </Button>
              )}
            </div>

            {isRecording && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-sm font-medium text-primary">
                  Recording as {user?.displayName}
                </span>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-sm font-semibold">Live Transcript</h3>
              <ScrollArea className="h-[400px] rounded-lg border border-border bg-muted/30 p-4">
                {meeting.transcript.length === 0 && !interimTranscript ? (
                  <p className="text-center text-sm text-muted-foreground">
                    No transcript yet. Start recording to begin.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {meeting.transcript.map((segment) => (
                      <div key={segment.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {segment.speakerName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(segment.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">
                          {segment.text}
                        </p>
                      </div>
                    ))}
                    {interimTranscript && (
                      <div className="space-y-1">
                        <Badge variant="secondary" className="text-xs">
                          {user?.displayName} (speaking...)
                        </Badge>
                        <p className="text-sm leading-relaxed text-muted-foreground italic">
                          {interimTranscript}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {meeting.summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-semibold">Overview</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {meeting.summary.overview}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="mb-2 text-sm font-semibold">Key Points</h3>
                <ul className="space-y-1">
                  {meeting.summary.keyPoints.map((point, i) => (
                    <li
                      key={i}
                      className="text-sm leading-relaxed text-muted-foreground"
                    >
                      • {point}
                    </li>
                  ))}
                </ul>
              </div>

              {meeting.summary.actionItems.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Action Items</h3>
                    <ul className="space-y-1">
                      {meeting.summary.actionItems.map((item, i) => (
                        <li
                          key={i}
                          className="text-sm leading-relaxed text-muted-foreground"
                        >
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {meeting.summary.decisions.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Decisions</h3>
                    <ul className="space-y-1">
                      {meeting.summary.decisions.map((decision, i) => (
                        <li
                          key={i}
                          className="text-sm leading-relaxed text-muted-foreground"
                        >
                          • {decision}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <h3 className="mb-2 text-sm font-semibold">
                  Speaker Contributions
                </h3>
                <div className="space-y-3">
                  {meeting.summary.speakerContributions.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <Badge variant="outline">{item.speaker}</Badge>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.contribution}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:sticky lg:top-4 lg:h-fit">
        <ParticipantListPanel meeting={meeting} />
      </div>

      {meeting && (
        <AddParticipantsDialog
          meeting={meeting}
          open={addParticipantsOpen}
          onOpenChange={setAddParticipantsOpen}
        />
      )}
    </div>
  );
}
