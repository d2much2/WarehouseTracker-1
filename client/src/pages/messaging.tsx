import { MessagingPanel } from "@/components/messaging-panel";

export default function Messaging() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Chat with your team members in real-time
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <MessagingPanel />
      </div>
    </div>
  );
}
