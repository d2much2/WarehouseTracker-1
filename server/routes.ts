import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { networkInterfaces } from "os";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword } from "./auth";
import passport from "passport";
import {
  insertProductSchema,
  insertWarehouseSchema,
  insertSupplierSchema,
  insertStockMovementSchema,
  insertInventoryLevelSchema,
  insertMessageSchema,
  insertCustomerSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  signupSchema,
  loginSchema,
} from "@shared/schema";
import { z } from "zod";
import Papa from "papaparse";
import type { WebSocketMessage } from "@shared/websocket-types";
import { chatWithAssistant } from "./ai-assistant";

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

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already registered" });
      }

      const passwordHash = await hashPassword(validatedData.password);
      
      const newUser = await storage.createUser({
        username: validatedData.username,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: "staff",
      });

      req.login(newUser, (err) => {
        if (err) {
          console.error("Login error after signup:", err);
          return res.status(500).json({ message: "Failed to log in after signup" });
        }
        const { passwordHash: _, ...userWithoutPassword } = newUser;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ message: "Invalid signup data" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        req.login(user, (loginErr) => {
          if (loginErr) {
            return next(loginErr);
          }
          const { passwordHash: _, ...userWithoutPassword } = user;
          return res.json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const { passwordHash: _, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
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
      const userId = req.user.id;
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

  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/device-info", isAuthenticated, async (req, res) => {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
      const userAgent = req.headers['user-agent'] || 'Unknown';
      
      res.json({
        ip: Array.isArray(ip) ? ip[0] : ip.toString().split(',')[0].trim(),
        userAgent,
      });
    } catch (error) {
      console.error("Error fetching device info:", error);
      res.status(500).json({ message: "Failed to fetch device info" });
    }
  });

  app.get("/api/network-info", isAuthenticated, async (req, res) => {
    try {
      const os = await import('os');
      const interfaces = os.networkInterfaces();
      const addresses: Array<{
        name: string;
        address: string;
        family: string;
        internal: boolean;
      }> = [];
      
      for (const [name, nets] of Object.entries(interfaces)) {
        if (nets) {
          for (const net of nets) {
            if (!net.internal && net.family === 'IPv4') {
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
      
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:5000';
      const port = parseInt(process.env.PORT || '5000', 10);
      
      const httpUrl = `${protocol}://${host}`;
      const wsProtocol = protocol === 'https' ? 'wss' : 'ws';
      const webSocketUrl = `${wsProtocol}://${host}/ws`;
      
      res.json({
        addresses,
        port,
        hostname: os.hostname(),
        httpUrl,
        webSocketUrl,
      });
    } catch (error) {
      console.error("Error fetching network info:", error);
      res.status(500).json({ message: "Failed to fetch network info" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const data = insertMessageSchema.parse({
        userId: req.user.id,
        recipientId: req.body.recipientId || null,
        content: req.body.content,
      });
      
      const message = await storage.createMessage(data);
      const user = await storage.getUser(message.userId);
      
      if (wss && user) {
        const messageData = {
          id: message.id,
          userId: user.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown',
          userUsername: user.username || '',
          recipientId: message.recipientId,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
        };
        
        if (message.recipientId) {
          wss.clients.forEach((client: any) => {
            if (client.readyState === WebSocket.OPEN) {
              if (client.userId === message.recipientId || client.userId === user.id) {
                client.send(JSON.stringify({
                  type: "chat_message",
                  data: messageData,
                  timestamp: new Date().toISOString(),
                }));
              }
            }
          });
        } else {
          broadcastToClients(wss, {
            type: "chat_message",
            data: messageData,
            timestamp: new Date().toISOString(),
          });
        }
      }
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getRecentMessages(limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/conversation/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const otherUserId = req.params.userId;
      const currentUserId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      const messages = await storage.getConversationMessages(currentUserId, otherUserId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      res.status(500).json({ message: "Failed to fetch conversation messages" });
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

  const aiChatSchema = z.object({
    message: z.string().min(1, "Message cannot be empty"),
    conversationHistory: z.array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    ).optional().default([]),
  });

  // Customer routes
  app.get("/api/customers", isAuthenticated, async (_req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  app.patch("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validatedData);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  app.delete("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Order routes
  app.get("/api/orders", isAuthenticated, async (_req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orderSchema = z.object({
        customerId: z.string(),
        status: z.enum(['pending', 'processing', 'fulfilled', 'cancelled']).optional(),
        totalAmount: z.string(),
        notes: z.string().optional(),
        items: z.array(z.object({
          productId: z.string(),
          warehouseId: z.string(),
          quantity: z.number().int().positive(),
          unitPrice: z.string(),
          subtotal: z.string(),
        })),
      });

      const validatedData = orderSchema.parse(req.body);
      
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const order = await storage.createOrder(
        {
          orderNumber,
          customerId: validatedData.customerId,
          status: validatedData.status || 'pending',
          totalAmount: validatedData.totalAmount,
          notes: validatedData.notes,
          userId: req.user.id,
        },
        validatedData.items.map(item => ({
          orderId: '', // Will be set by the database
          productId: item.productId,
          warehouseId: item.warehouseId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        }))
      );

      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  app.patch("/api/orders/:id/status", isAuthenticated, async (req, res) => {
    try {
      const statusSchema = z.object({
        status: z.enum(['pending', 'processing', 'fulfilled', 'cancelled']),
      });

      const { status } = statusSchema.parse(req.body);
      const order = await storage.updateOrderStatus(req.params.id, status);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(400).json({ message: "Invalid status" });
    }
  });

  app.post("/api/orders/:id/fulfill", isAuthenticated, async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await storage.fulfillOrder(req.params.id, req.user.id);
      
      const order = await storage.getOrder(req.params.id);
      res.json(order);
    } catch (error) {
      console.error("Error fulfilling order:", error);
      res.status(500).json({ message: "Failed to fulfill order" });
    }
  });

  app.get("/api/customers/:customerId/orders", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrdersByCustomer(req.params.customerId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(500).json({ message: "Failed to fetch customer orders" });
    }
  });

  app.post("/api/ai/chat", isAuthenticated, async (req, res) => {
    try {
      const validation = aiChatSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validation.error.errors,
        });
      }
      
      const { message, conversationHistory } = validation.data;
      
      const response = await chatWithAssistant(message, conversationHistory);
      
      res.json({ response });
    } catch (error) {
      console.error("Error in AI chat:", error);
      
      if (error instanceof Error) {
        if (error.message.includes('not configured')) {
          return res.status(503).json({ 
            message: "AI assistant is not available. Please contact your administrator.",
          });
        }
      }
      
      res.status(500).json({ 
        message: "Failed to get AI response. Please try again.",
      });
    }
  });

  const httpServer = createServer(app);
  
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  
  wss.on("connection", (ws: WebSocket & { userId?: string }, req) => {
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
        
        if (data.type === "auth" && data.userId) {
          ws.userId = data.userId;
          console.log(`WebSocket client authenticated as user ${data.userId}`);
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
