import {
  users,
  products,
  warehouses,
  suppliers,
  inventoryLevels,
  stockMovements,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Warehouse,
  type InsertWarehouse,
  type Supplier,
  type InsertSupplier,
  type InventoryLevel,
  type InsertInventoryLevel,
  type StockMovement,
  type InsertStockMovement,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, sum, count } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  searchProducts(query: string): Promise<Product[]>;
  
  getAllWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: string): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined>;
  deleteWarehouse(id: string): Promise<void>;
  
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<void>;
  
  getInventoryByProduct(productId: string): Promise<InventoryLevel[]>;
  getInventoryByWarehouse(warehouseId: string): Promise<InventoryLevel[]>;
  getLowStockAlerts(): Promise<Array<InventoryLevel & { product: Product }>>;
  updateInventoryLevel(data: InsertInventoryLevel): Promise<InventoryLevel>;
  
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  getStockMovements(filters?: { productId?: string; warehouseId?: string; type?: string }): Promise<StockMovement[]>;
  getRecentMovements(limit?: number): Promise<StockMovement[]>;
  
  getDashboardKPIs(): Promise<{
    totalProducts: number;
    stockValue: number;
    lowStockCount: number;
    activeWarehouses: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async searchProducts(query: string): Promise<Product[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(products)
      .where(
        or(
          sql`${products.name} ILIKE ${searchPattern}`,
          sql`${products.sku} ILIKE ${searchPattern}`,
          sql`${products.category} ILIKE ${searchPattern}`,
          sql`${products.barcode} ILIKE ${searchPattern}`
        )
      );
  }

  async getAllWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses);
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse;
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const [newWarehouse] = await db.insert(warehouses).values(warehouse).returning();
    return newWarehouse;
  }

  async updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    const [updatedWarehouse] = await db
      .update(warehouses)
      .set(warehouse)
      .where(eq(warehouses.id, id))
      .returning();
    return updatedWarehouse;
  }

  async deleteWarehouse(id: string): Promise<void> {
    await db.delete(warehouses).where(eq(warehouses.id, id));
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set(supplier)
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: string): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async getInventoryByProduct(productId: string): Promise<InventoryLevel[]> {
    return await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.productId, productId));
  }

  async getInventoryByWarehouse(warehouseId: string): Promise<InventoryLevel[]> {
    return await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.warehouseId, warehouseId));
  }

  async getLowStockAlerts(): Promise<Array<InventoryLevel & { product: Product }>> {
    const results = await db
      .select({
        id: inventoryLevels.id,
        productId: inventoryLevels.productId,
        warehouseId: inventoryLevels.warehouseId,
        quantity: inventoryLevels.quantity,
        updatedAt: inventoryLevels.updatedAt,
        product: products,
      })
      .from(inventoryLevels)
      .innerJoin(products, eq(inventoryLevels.productId, products.id))
      .where(sql`${inventoryLevels.quantity} < ${products.lowStockThreshold}`);
    
    return results.map(row => ({
      id: row.id,
      productId: row.productId,
      warehouseId: row.warehouseId,
      quantity: row.quantity,
      updatedAt: row.updatedAt,
      product: row.product,
    }));
  }

  async updateInventoryLevel(data: InsertInventoryLevel): Promise<InventoryLevel> {
    const existing = await db
      .select()
      .from(inventoryLevels)
      .where(
        and(
          eq(inventoryLevels.productId, data.productId),
          eq(inventoryLevels.warehouseId, data.warehouseId)
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(inventoryLevels)
        .set({
          quantity: data.quantity,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryLevels.productId, data.productId),
            eq(inventoryLevels.warehouseId, data.warehouseId)
          )
        )
        .returning();
      return updated;
    } else {
      const [newInventory] = await db
        .insert(inventoryLevels)
        .values(data)
        .returning();
      return newInventory;
    }
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    return await db.transaction(async (tx) => {
      const [newMovement] = await tx
        .insert(stockMovements)
        .values(movement)
        .returning();

      const existingInventory = await tx
        .select()
        .from(inventoryLevels)
        .where(
          and(
            eq(inventoryLevels.productId, movement.productId),
            eq(inventoryLevels.warehouseId, movement.warehouseId)
          )
        );

      const currentQuantity = existingInventory.length > 0 ? existingInventory[0].quantity : 0;

      if (movement.type === "in" || movement.type === "adjustment") {
        const newQuantity = currentQuantity + movement.quantity;
        await this.updateInventoryLevelInTransaction(tx, {
          productId: movement.productId,
          warehouseId: movement.warehouseId,
          quantity: newQuantity,
        });
      } else if (movement.type === "out") {
        if (currentQuantity < movement.quantity) {
          throw new Error("Insufficient stock for outbound movement");
        }
        const newQuantity = currentQuantity - movement.quantity;
        await this.updateInventoryLevelInTransaction(tx, {
          productId: movement.productId,
          warehouseId: movement.warehouseId,
          quantity: newQuantity,
        });
      } else if (movement.type === "transfer") {
        if (!movement.targetWarehouseId) {
          throw new Error("Target warehouse required for transfer");
        }
        if (currentQuantity < movement.quantity) {
          throw new Error("Insufficient stock for transfer");
        }

        const newSourceQuantity = currentQuantity - movement.quantity;
        await this.updateInventoryLevelInTransaction(tx, {
          productId: movement.productId,
          warehouseId: movement.warehouseId,
          quantity: newSourceQuantity,
        });

        const targetInventory = await tx
          .select()
          .from(inventoryLevels)
          .where(
            and(
              eq(inventoryLevels.productId, movement.productId),
              eq(inventoryLevels.warehouseId, movement.targetWarehouseId)
            )
          );

        const targetCurrentQuantity = targetInventory.length > 0 ? targetInventory[0].quantity : 0;
        const newTargetQuantity = targetCurrentQuantity + movement.quantity;
        await this.updateInventoryLevelInTransaction(tx, {
          productId: movement.productId,
          warehouseId: movement.targetWarehouseId,
          quantity: newTargetQuantity,
        });
      }

      return newMovement;
    });
  }

  private async updateInventoryLevelInTransaction(
    tx: any,
    data: InsertInventoryLevel
  ): Promise<void> {
    const existing = await tx
      .select()
      .from(inventoryLevels)
      .where(
        and(
          eq(inventoryLevels.productId, data.productId),
          eq(inventoryLevels.warehouseId, data.warehouseId)
        )
      );

    if (existing.length > 0) {
      await tx
        .update(inventoryLevels)
        .set({
          quantity: data.quantity,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryLevels.productId, data.productId),
            eq(inventoryLevels.warehouseId, data.warehouseId)
          )
        );
    } else {
      await tx.insert(inventoryLevels).values(data);
    }
  }

  async getStockMovements(filters?: {
    productId?: string;
    warehouseId?: string;
    type?: string;
  }): Promise<StockMovement[]> {
    if (!filters) {
      return await db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt));
    }

    const conditions = [];
    if (filters.productId) {
      conditions.push(eq(stockMovements.productId, filters.productId));
    }
    if (filters.warehouseId) {
      conditions.push(eq(stockMovements.warehouseId, filters.warehouseId));
    }
    if (filters.type) {
      conditions.push(eq(stockMovements.type, filters.type as any));
    }

    if (conditions.length === 0) {
      return await db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt));
    }

    return await db
      .select()
      .from(stockMovements)
      .where(and(...conditions))
      .orderBy(desc(stockMovements.createdAt));
  }

  async getRecentMovements(limit: number = 10): Promise<StockMovement[]> {
    return await db
      .select()
      .from(stockMovements)
      .orderBy(desc(stockMovements.createdAt))
      .limit(limit);
  }

  async getDashboardKPIs(): Promise<{
    totalProducts: number;
    stockValue: number;
    lowStockCount: number;
    activeWarehouses: number;
  }> {
    const [productCount] = await db
      .select({ count: count() })
      .from(products);

    const [totalInventory] = await db
      .select({ total: sum(inventoryLevels.quantity) })
      .from(inventoryLevels);

    const lowStockItems = await db
      .select({
        id: inventoryLevels.id,
        quantity: inventoryLevels.quantity,
        threshold: products.lowStockThreshold,
      })
      .from(inventoryLevels)
      .innerJoin(products, eq(inventoryLevels.productId, products.id))
      .where(sql`${inventoryLevels.quantity} < ${products.lowStockThreshold}`);

    const [activeWarehouseCount] = await db
      .select({ count: count() })
      .from(warehouses)
      .where(eq(warehouses.status, "active"));

    return {
      totalProducts: productCount.count,
      stockValue: Number(totalInventory.total) || 0,
      lowStockCount: lowStockItems.length,
      activeWarehouses: activeWarehouseCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
