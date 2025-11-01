import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertProductSchema,
  insertWarehouseSchema,
  insertSupplierSchema,
  insertStockMovementSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
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
      await storage.deleteProduct(req.params.id);
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
      await storage.deleteWarehouse(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      res.status(500).json({ message: "Failed to delete warehouse" });
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

  const httpServer = createServer(app);
  return httpServer;
}
