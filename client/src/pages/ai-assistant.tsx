import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VoiceInputButton } from "@/components/voice-input-button";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your inventory management assistant. I can help you with questions about your stock levels, warehouses, products, and provide insights to optimize your inventory. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatMutation = useMutation<{ response: string }, Error, string>({
    mutationFn: async (userMessage: string) => {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      
      const result = await apiRequest("POST", "/api/ai/chat", {
        message: userMessage,
        conversationHistory,
      });
      
      return result as unknown as { response: string };
    },
    onSuccess: (data: { response: string }) => {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        },
      ]);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to get response from AI assistant";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      },
    ]);
    setInput("");
    chatMutation.mutate(userMessage);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Inventory Assistant
        </h1>
        <p className="text-muted-foreground mt-1">
          Ask questions about your inventory, get insights, and receive recommendations
        </p>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Chat with AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
            <div className="space-y-4 py-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  data-testid={`message-${index}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={msg.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                      {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="inline-block rounded-lg px-4 py-2 bg-muted">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-4">
            <form onSubmit={handleSend} className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about inventory, stock levels, warehouses..."
                  disabled={chatMutation.isPending}
                  className="flex-1"
                  data-testid="input-ai-message"
                />
                <VoiceInputButton
                  onTranscript={(text) => setInput(prev => prev + (prev ? ' ' : '') + text)}
                />
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || chatMutation.isPending}
                data-testid="button-send-ai-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Try asking: "What items are low on stock?" or "How many products do I have?"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
