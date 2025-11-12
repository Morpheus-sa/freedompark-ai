"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Mail, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User, Meeting } from "@/types/meeting";
import { logActivity } from "@/lib/activity-logger";
import { sendNotification } from "@/lib/notification-service";

interface AddParticipantsDialogProps {
  meeting: Meeting;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddParticipantsDialog({
  meeting,
  open,
  onOpenChange,
}: AddParticipantsDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;

    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(usersData);
      },
      (error) => {
        console.error(" Error loading users:", error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
      }
    );

    return unsubscribe;
  }, [open, toast]);

  const filteredUsers = users.filter((user) => {
    if (meeting.participants.includes(user.uid)) return false;

    const matchesSearch =
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const handleAddParticipant = async (targetUser: User) => {
    if (!currentUser) return;

    setLoading((prev) => ({ ...prev, [targetUser.uid]: true }));

    try {
      const meetingRef = doc(db, "meetings", meeting.id);

      await updateDoc(meetingRef, {
        participants: arrayUnion(targetUser.uid),
      });

      await logActivity(
        currentUser.uid,
        currentUser.email,
        currentUser.displayName,
        "meeting_participant_added",
        `${currentUser.displayName} added ${targetUser.displayName} to meeting "${meeting.title}"`,
        {
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          addedUserId: targetUser.uid,
          addedUserEmail: targetUser.email,
        }
      );

      await sendNotification(
        targetUser.uid,
        meeting.isActive ? "participant_added" : "meeting_invitation",
        meeting.isActive ? "Added to Active Meeting" : "Meeting Invitation",
        meeting.isActive
          ? `You've been added to "${meeting.title}" by ${currentUser.displayName}`
          : `You've been invited to "${meeting.title}" by ${currentUser.displayName}`,
        {
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          meetingCode: meeting.shareCode,
        }
      );

      toast({
        title: "Participant added",
        description: `${targetUser.displayName} has been added to the meeting and notified`,
      });
    } catch (error: any) {
      console.error(" Error adding participant:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add participant",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, [targetUser.uid]: false }));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Participants
          </DialogTitle>
          <DialogDescription>
            Invite users to join this meeting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center">
                <UserPlus className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "No users found matching your search"
                    : "All users are already participants"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.uid}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-foreground text-sm truncate">
                          {user.displayName}
                        </p>
                        {user.isAdmin && (
                          <Badge variant="secondary" className="text-xs h-5">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.company && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">{user.company}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleAddParticipant(user)}
                      disabled={loading[user.uid]}
                      className="shrink-0"
                    >
                      {loading[user.uid] ? (
                        "Adding..."
                      ) : (
                        <>
                          <UserPlus className="mr-1 h-3 w-3" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Current participants:</span>
            <Badge variant="outline">{meeting.participants.length}</Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
