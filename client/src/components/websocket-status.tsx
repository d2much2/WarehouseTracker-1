import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

interface WebSocketStatusProps {
  connectionStatus: "connecting" | "connected" | "disconnected";
}

export function WebSocketStatus({ connectionStatus }: WebSocketStatusProps) {
  const statusConfig = {
    connected: {
      label: "Live",
      variant: "default" as const,
      icon: Wifi,
      className: "bg-green-500 hover:bg-green-500 text-white",
    },
    connecting: {
      label: "Connecting",
      variant: "secondary" as const,
      icon: Wifi,
      className: "bg-yellow-500 hover:bg-yellow-500 text-white",
    },
    disconnected: {
      label: "Offline",
      variant: "destructive" as const,
      icon: WifiOff,
      className: "",
    },
  };

  const config = statusConfig[connectionStatus];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`text-xs ${config.className}`}
      data-testid="websocket-status"
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
