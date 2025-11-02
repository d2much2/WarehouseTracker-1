export type WebSocketMessageType =
  | "inventory_updated"
  | "stock_movement_created"
  | "product_updated"
  | "warehouse_updated"
  | "chat_message"
  | "ping"
  | "pong";

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data?: any;
  timestamp: string;
}

export interface InventoryUpdatedMessage extends WebSocketMessage {
  type: "inventory_updated";
  data: {
    productId: string;
    warehouseId: string;
    quantity: number;
    row?: string;
    shelf?: string;
  };
}

export interface StockMovementCreatedMessage extends WebSocketMessage {
  type: "stock_movement_created";
  data: {
    id: string;
    productId: string;
    warehouseId: string;
    type: string;
    quantity: number;
    row?: string;
    shelf?: string;
  };
}

export interface ProductUpdatedMessage extends WebSocketMessage {
  type: "product_updated";
  data: {
    id: string;
  };
}

export interface WarehouseUpdatedMessage extends WebSocketMessage {
  type: "warehouse_updated";
  data: {
    id: string;
  };
}

export interface ChatMessage extends WebSocketMessage {
  type: "chat_message";
  data: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    content: string;
    createdAt: string;
  };
}
