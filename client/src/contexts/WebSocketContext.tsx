import { createContext, useContext, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { queryClient } from "@/lib/queryClient";
import type { WebSocketMessage } from "@shared/websocket-types";

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected";
  sendMessage: (message: WebSocketMessage) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { data: currentUser } = useQuery<{ id: string }>({
    queryKey: ["/api/auth/user"],
  });

  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log("Received WebSocket message:", message);

    switch (message.type) {
      case "inventory_updated":
        queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/kpis"] });
        if (message.data?.warehouseId) {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/inventory/warehouse", message.data.warehouseId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ["/api/warehouses", message.data.warehouseId, "inventory"] 
          });
        }
        break;

      case "stock_movement_created":
        queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stock-movements/recent"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/kpis"] });
        break;

      case "product_updated":
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        if (message.data?.id) {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/products", message.data.id] 
          });
        }
        break;

      case "warehouse_updated":
        queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
        if (message.data?.id) {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/warehouses", message.data.id] 
          });
        }
        break;

      case "chat_message":
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        if (message.data?.recipientId) {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/messages/conversation", message.data.userId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ["/api/messages/conversation", message.data.recipientId] 
          });
        }
        break;
    }
  }, []);

  const { isConnected, connectionStatus, sendMessage } = useWebSocket(handleMessage, currentUser?.id);

  return (
    <WebSocketContext.Provider value={{ isConnected, connectionStatus, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider");
  }
  return context;
}
