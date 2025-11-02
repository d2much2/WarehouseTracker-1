import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, X, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface MessageWithUser {
  id: string;
  userId: string;
  recipientId: string | null;
  content: string;
  createdAt: string;
  user: User;
  recipient?: User | null;
}

interface MessagingPanelProps {
  onClose?: () => void;
}

export function MessagingPanel({ onClose }: MessagingPanelProps) {
  const [message, setMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: broadcastMessages = [] } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/messages"],
    enabled: selectedUserId === null,
  });

  const { data: conversationMessages = [] } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/messages/conversation", selectedUserId],
    enabled: selectedUserId !== null,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; recipientId?: string }) => {
      return await apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      setMessage("");
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: ["/api/messages/conversation", selectedUserId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [broadcastMessages, conversationMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate({
        content: message.trim(),
        recipientId: selectedUserId || undefined,
      });
    }
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getUserName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email || 'Unknown User';
  };

  const messages = selectedUserId ? conversationMessages : broadcastMessages;
  const reversedMessages = [...messages].reverse();
  const otherUsers = users.filter(u => u.id !== currentUser?.id);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <div>
            <CardTitle className="text-lg">
              {selectedUserId 
                ? getUserName(users.find(u => u.id === selectedUserId)!) 
                : 'Team Chat'}
            </CardTitle>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedUserId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUserId(null)}
              data-testid="button-back-to-team"
            >
              <Users className="h-4 w-4 mr-2" />
              All
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-chat"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex p-0 overflow-hidden">
        {!selectedUserId && (
          <div className="w-64 border-r flex flex-col">
            <div className="p-3 border-b bg-muted/50">
              <h3 className="font-medium text-sm">Direct Messages</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {otherUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover-elevate text-left"
                    data-testid={`button-user-${user.id}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm flex-1 truncate">{getUserName(user)}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        <div className="flex-1 flex flex-col">
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
            <div className="space-y-4 py-4">
              {reversedMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {selectedUserId 
                    ? 'No messages yet. Start the conversation!'
                    : 'No team messages yet.'}
                </div>
              ) : (
                reversedMessages.map((msg) => {
                  const isCurrentUser = msg.userId === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                      data-testid={`message-${msg.id}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.user.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">{getInitials(msg.user)}</AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                        <div className="flex items-baseline gap-2 mb-1">
                          {!isCurrentUser && (
                            <span className="text-sm font-medium">{getUserName(msg.user)}</span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div
                          className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                            isCurrentUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm break-words">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={selectedUserId ? "Send a direct message..." : "Send a team message..."}
                disabled={sendMessageMutation.isPending}
                className="flex-1"
                data-testid="input-message"
              />
              <Button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            {selectedUserId && (
              <p className="text-xs text-muted-foreground mt-2">
                Sending to {getUserName(users.find(u => u.id === selectedUserId)!)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
