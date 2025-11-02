import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { networkInterfaces } from "os";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertProductSchema,
  insertWarehouseSchema,
  insertSupplierSchema,
  insertStockMovementSchema,
  insertInventoryLevelSchema,
} from "@shared/schema";
import { z } from "zod";
import Papa from "papaparse";
import type { WebSocketMessage } from "@shared/websocket-types";

function broadcastToClients(wss: WebSocketServer, message: WebSocketMessage) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  let wss: WebSocketServer;
  
  // Health check endpoint for deployment
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Network information endpoint
  app.get("/api/network-info", (_req, res) => {
    try {
      const interfaces = networkInterfaces();
      const addresses: Array<{ name: string; address: string; family: string; internal: boolean }> = [];
      
      for (const [name, nets] of Object.entries(interfaces)) {
        if (nets) {
          for (const net of nets) {
            if (net.family === 'IPv4' && !net.internal) {
              addresses.push({
                name,
                address: net.address,
                family: net.family,
                internal: net.internal,
              });
            }
          }
        }
      }

      const port = process.env.PORT || 5000;
      const hostname = process.env.REPL_SLUG || 'warehouse-inventory';
      
      res.json({
        addresses,
        port,
        hostname,
        webSocketUrl: addresses.length > 0 ? `ws://${addresses[0].address}:${port}/ws` : null,
        httpUrl: addresses.length > 0 ? `http://${addresses[0].address}:${port}` : null,
      });
    } catch (error) {
      console.error("Error fetching network info:", error);
      res.status(500).json({ message: "Failed to fetch network information" });
    }
  });

  await setupAuth(app);

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const { search } = req.query;
      let productsList;
      
      if (search && typeof search === "string") {
        productsList = await storage.searchProducts(search);
      } else {
        productsList = await storage.getAllProducts();
      }
      
      res.json(productsList);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const newProduct = await storage.createProduct(validatedData);
      
      if (wss) {
        broadcastToClients(wss, {
          type: "product_updated",
          data: { id: newProduct.id },
          timestamp: new Date().toISOString(),
        });
      }
      
      res.status(201).json(newProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertProductSchema.partial().parse(req.body);
      const updatedProduct = await storage.updateProduct(req.params.id, validatedData);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (wss) {
        broadcastToClients(wss, {
          type: "product_updated",
          data: { id: updatedProduct.id },
          timestamp: new Date().toISOString(),
        });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const productId = req.params.id;
      await storage.deleteProduct(productId);
      
      if (wss) {
        broadcastToClients(wss, {
          type: "product_updated",
          data: { id: productId },
          timestamp: new Date().toISOString(),
        });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.get("/api/warehouses", isAuthenticated, async (req, res) => {
    try {
      const warehousesList = await storage.getAllWarehouses();
      res.json(warehousesList);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.status(500).json({ message: "Failed to fetch warehouses" });
    }
  });

  app.get("/api/warehouses/:id", isAuthenticated, async (req, res) => {
    try {
      const warehouse = await storage.getWarehouse(req.params.id);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.json(warehouse);
    } catch (error) {
      console.error("Error fetching warehouse:", error);
      res.status(500).json({ message: "Failed to fetch warehouse" });
    }
  });

  app.post("/api/warehouses", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertWarehouseSchema.parse(req.body);
      const newWarehouse = await storage.createWarehouse(validatedData);
      
      if (wss) {
        broadcastToClients(wss, {
          type: "warehouse_updated",
          data: { id: newWarehouse.id },
          timestamp: new Date().toISOString(),
        });
      }
      
      res.status(201).json(newWarehouse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating warehouse:", error);
      res.status(500).json({ message: "Failed to create warehouse" });
    }
  });

  app.patch("/api/warehouses/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertWarehouseSchema.partial().parse(req.body);
      const updatedWarehouse = await storage.updateWarehouse(req.params.id, validatedData);
      if (!updatedWarehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      
      if (wss) {
        broadcastToClients(wss, {
          type: "warehouse_updated",
          data: { id: updatedWarehouse.id },
          timestamp: new Date().toISOString(),
        });
      }
      
      res.json(updatedWarehouse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating warehouse:", error);
      res.status(500).json({ message: "Failed to update warehouse" });
    }
  });

  app.delete("/api/warehouses/:id", isAuthenticated, async (req, res) => {
    try {
      const warehouseId = req.params.id;
      await storage.deleteWarehouse(warehouseId);
      
      if (wss) {
        broadcastToClients(wss, {
          type: "warehouse_updated",
          data: { id: warehouseId },
          timestamp: new Date().toISOString(),
        });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      res.status(500).json({ message: "Failed to delete warehouse" });
    }
  });

  app.get("/api/warehouses/:id/inventory", isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.getWarehouseInventoryWithProducts(req.params.id);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching warehouse inventory:", error);
      res.status(500).json({ message: "Failed to fetch warehouse inventory" });
    }
  });

  app.get("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const suppliersList = await storage.getAllSuppliers();
      res.json(suppliersList);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.get("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  app.post("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const newSupplier = await storage.createSupplier(validatedData);
      res.status(201).json(newSupplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.patch("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const updatedSupplier = await storage.updateSupplier(req.params.id, validatedData);
      if (!updatedSupplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(updatedSupplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteSupplier(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  app.get("/api/inventory/product/:productId", isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.getInventoryByProduct(req.params.productId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory by product:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/warehouse/:warehouseId", isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.getInventoryByWarehouse(req.params.warehouseId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory by warehouse:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/low-stock", isAuthenticated, async (req, res) => {
    try {
      const lowStockItems = await storage.getLowStockAlerts();
      res.json(lowStockItems);
    } catch (error) {
      console.error("Error fetching low stock alerts:", error);
      res.status(500).json({ message: "Failed to fetch low stock alerts" });
    }
  });

  app.get("/api/stock-movements", isAuthenticated, async (req, res) => {
    try {
      const { productId, warehouseId, type } = req.query;
      const filters: any = {};
      
      if (productId && typeof productId === "string") {
        filters.productId = productId;
      }
      if (warehouseId && typeof warehouseId === "string") {
        filters.warehouseId = warehouseId;
      }
      if (type && typeof type === "string") {
        filters.type = type;
      }
      
      const movements = await storage.getStockMovements(
        Object.keys(filters).length > 0 ? filters : undefined
      );
      res.json(movements);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      res.status(500).json({ message: "Failed to fetch stock movements" });
    }
  });

  app.get("/api/stock-movements/recent", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const movements = await storage.getRecentMovements(limit);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching recent movements:", error);
      res.status(500).json({ message: "Failed to fetch recent movements" });
    }
  });

  app.post("/api/stock-movements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertStockMovementSchema.parse({
        ...req.body,
        userId,
      });
      
      const newMovement = await storage.createStockMovement(validatedData);
      
      if (wss) {
        broadcastToClients(wss, {
          type: "stock_movement_created",
          data: {
            id: newMovement.id,
            productId: newMovement.productId,
            warehouseId: newMovement.warehouseId,
            type: newMovement.type,
            quantity: newMovement.quantity,
            row: newMovement.row,
            shelf: newMovement.shelf,
          },
          timestamp: new Date().toISOString(),
        });
        
        broadcastToClients(wss, {
          type: "inventory_updated",
          data: {
            productId: newMovement.productId,
            warehouseId: newMovement.warehouseId,
            quantity: 0,
            row: newMovement.row,
            shelf: newMovement.shelf,
          },
          timestamp: new Date().toISOString(),
        });
      }
      
      res.status(201).json(newMovement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error instanceof Error) {
        if (error.message.includes("Insufficient stock")) {
          return res.status(400).json({ message: error.message });
        }
        if (error.message.includes("Target warehouse required")) {
          return res.status(400).json({ message: error.message });
        }
      }
      console.error("Error creating stock movement:", error);
      res.status(500).json({ message: "Failed to create stock movement" });
    }
  });

  app.get("/api/dashboard/kpis", isAuthenticated, async (req, res) => {
    try {
      const kpis = await storage.getDashboardKPIs();
      res.json(kpis);
    } catch (error) {
      console.error("Error fetching dashboard KPIs:", error);
      res.status(500).json({ message: "Failed to fetch dashboard KPIs" });
    }
  });

  app.post("/api/csv/upload/products", isAuthenticated, async (req, res) => {
    try {
      const { data } = req.body;
      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ message: "Invalid CSV data format" });
      }

      const validatedProducts = data.map((row: any) => 
        insertProductSchema.parse({
          sku: row.sku,
          name: row.name,
          description: row.description || null,
          category: row.category,
          barcode: row.barcode || null,
          supplierId: row.supplierId || null,
          lowStockThreshold: row.lowStockThreshold ? parseInt(row.lowStockThreshold) : 50,
        })
      );

      const createdProducts = await storage.bulkCreateProducts(validatedProducts);
      
      if (wss) {
        broadcastToClients(wss, {
          type: "product_updated",
          data: {},
          timestamp: new Date().toISOString(),
        });
      }
      
      res.status(201).json({ 
        message: `Successfully imported ${createdProducts.length} products`,
        count: createdProducts.length,
        products: createdProducts 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error uploading products CSV:", error);
      res.status(500).json({ message: "Failed to import products" });
    }
  });

  app.post("/api/csv/upload/warehouses", isAuthenticated, async (req, res) => {
    try {
      const { data } = req.body;
      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ message: "Invalid CSV data format" });
      }

      const validatedWarehouses = data.map((row: any) => 
        insertWarehouseSchema.parse({
          name: row.name,
          location: row.location,
          capacity: parseInt(row.capacity),
          status: row.status || "active",
        })
      );

      const createdWarehouses = await storage.bulkCreateWarehouses(validatedWarehouses);
      
      if (wss) {
        broadcastToClients(wss, {
          type: "warehouse_updated",
          data: {},
          timestamp: new Date().toISOString(),
        });
      }
      
      res.status(201).json({ 
        message: `Successfully imported ${createdWarehouses.length} warehouses`,
        count: createdWarehouses.length,
        warehouses: createdWarehouses 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error uploading warehouses CSV:", error);
      res.status(500).json({ message: "Failed to import warehouses" });
    }
  });

  app.post("/api/csv/upload/suppliers", isAuthenticated, async (req, res) => {
    try {
      const { data } = req.body;
      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ message: "Invalid CSV data format" });
      }

      const validatedSuppliers = data.map((row: any) => 
        insertSupplierSchema.parse({
          name: row.name,
          contactPerson: row.contactPerson || null,
          email: row.email || null,
          phone: row.phone || null,
          address: row.address || null,
        })
      );

      const createdSuppliers = await storage.bulkCreateSuppliers(validatedSuppliers);
      res.status(201).json({ 
        message: `Successfully imported ${createdSuppliers.length} suppliers`,
        count: createdSuppliers.length,
        suppliers: createdSuppliers 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error uploading suppliers CSV:", error);
      res.status(500).json({ message: "Failed to import suppliers" });
    }
  });

  app.post("/api/csv/upload/inventory", isAuthenticated, async (req, res) => {
    try {
      const { data } = req.body;
      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ message: "Invalid CSV data format" });
      }

      const validatedInventory = data.map((row: any) => 
        insertInventoryLevelSchema.parse({
          productId: row.productId,
          warehouseId: row.warehouseId,
          quantity: parseInt(row.quantity),
          row: row.row || undefined,
          shelf: row.shelf || undefined,
        })
      );

      const updatedInventory = await storage.bulkUpdateInventoryLevels(validatedInventory);
      
      if (wss) {
        broadcastToClients(wss, {
          type: "inventory_updated",
          data: {},
          timestamp: new Date().toISOString(),
        });
      }
      
      res.status(201).json({ 
        message: `Successfully imported ${updatedInventory.length} inventory levels`,
        count: updatedInventory.length,
        inventory: updatedInventory 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error uploading inventory CSV:", error);
      res.status(500).json({ message: "Failed to import inventory" });
    }
  });

  app.get("/api/csv/download/products", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const csv = Papa.unparse(products);
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=products.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error downloading products CSV:", error);
      res.status(500).json({ message: "Failed to export products" });
    }
  });

  app.get("/api/csv/download/warehouses", isAuthenticated, async (req, res) => {
    try {
      const warehouses = await storage.getAllWarehouses();
      const csv = Papa.unparse(warehouses);
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=warehouses.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error downloading warehouses CSV:", error);
      res.status(500).json({ message: "Failed to export warehouses" });
    }
  });

  app.get("/api/csv/download/suppliers", isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getAllSuppliers();
      const csv = Papa.unparse(suppliers);
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=suppliers.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error downloading suppliers CSV:", error);
      res.status(500).json({ message: "Failed to export suppliers" });
    }
  });

  app.get("/api/csv/download/inventory", isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.getAllInventoryWithDetails();
      const csv = Papa.unparse(inventory);
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=inventory.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error downloading inventory CSV:", error);
      res.status(500).json({ message: "Failed to export inventory" });
    }
  });

  const httpServer = createServer(app);
  
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  
  wss.on("connection", (ws: WebSocket) => {
    console.log("WebSocket client connected");
    
    ws.send(JSON.stringify({
      type: "ping",
      timestamp: new Date().toISOString(),
    }));
    
    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === "pong") {
          console.log("Received pong from client");
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });
    
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
    
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });
  
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "ping",
          timestamp: new Date().toISOString(),
        }));
      }
    });
  }, 30000);
  
  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });
  
  (app as any).wss = wss;
  
  return httpServer;
}
