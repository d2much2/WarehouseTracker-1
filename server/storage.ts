import {
  users,
  products,
  warehouses,
  suppliers,
  inventoryLevels,
  stockMovements,
  messages,
  customers,
  orders,
  orderItems,
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
  type Message,
  type InsertMessage,
  type Customer,
  type InsertCustomer,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, sum, count } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  searchProducts(query: string): Promise<Product[]>;
  bulkCreateProducts(products: InsertProduct[]): Promise<Product[]>;
  
  getAllWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: string): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined>;
  deleteWarehouse(id: string): Promise<void>;
  bulkCreateWarehouses(warehouses: InsertWarehouse[]): Promise<Warehouse[]>;
  
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<void>;
  bulkCreateSuppliers(suppliers: InsertSupplier[]): Promise<Supplier[]>;
  
  getInventoryByProduct(productId: string): Promise<InventoryLevel[]>;
  getInventoryByWarehouse(warehouseId: string): Promise<InventoryLevel[]>;
  getWarehouseInventoryWithProducts(warehouseId: string): Promise<Array<InventoryLevel & { product: Product }>>;
  getLowStockAlerts(): Promise<Array<InventoryLevel & { product: Product }>>;
  updateInventoryLevel(data: InsertInventoryLevel): Promise<InventoryLevel>;
  bulkUpdateInventoryLevels(levels: InsertInventoryLevel[]): Promise<InventoryLevel[]>;
  getAllInventoryLevels(): Promise<InventoryLevel[]>;
  getAllInventoryWithDetails(): Promise<Array<{
    productId: string;
    productName: string;
    productSku: string;
    warehouseId: string;
    warehouseName: string;
    warehouseLocation: string;
    quantity: number;
    row: string | null;
    shelf: string | null;
    lowStockThreshold: number;
  }>>;
  
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  getStockMovements(filters?: { productId?: string; warehouseId?: string; type?: string }): Promise<StockMovement[]>;
  getRecentMovements(limit?: number): Promise<StockMovement[]>;
  
  getAllUsers(): Promise<User[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getRecentMessages(limit?: number): Promise<Array<Message & { user: User }>>;
  getConversationMessages(userId: string, otherUserId: string, limit?: number): Promise<Array<Message & { user: User; recipient: User | null }>>;
  
  getDashboardKPIs(): Promise<{
    totalProducts: number;
    stockValue: number;
    lowStockCount: number;
    activeWarehouses: number;
    totalOrders: number;
    pendingOrders: number;
    fulfilledOrders: number;
    totalRevenue: string;
  }>;
  
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<void>;
  
  getAllOrders(): Promise<Array<Order & { customer: Customer; user: User }>>;
  getOrder(id: string): Promise<(Order & { customer: Customer; user: User; items: Array<OrderItem & { product: Product; warehouse: Warehouse }> }) | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: string, status: "pending" | "processing" | "fulfilled" | "cancelled"): Promise<Order | undefined>;
  fulfillOrder(id: string, userId: string): Promise<void>;
  getOrdersByCustomer(customerId: string): Promise<Array<Order & { user: User }>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
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

  async bulkCreateProducts(productList: InsertProduct[]): Promise<Product[]> {
    if (productList.length === 0) return [];
    return await db.insert(products).values(productList).returning();
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

  async bulkCreateWarehouses(warehouseList: InsertWarehouse[]): Promise<Warehouse[]> {
    if (warehouseList.length === 0) return [];
    return await db.insert(warehouses).values(warehouseList).returning();
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

  async bulkCreateSuppliers(supplierList: InsertSupplier[]): Promise<Supplier[]> {
    if (supplierList.length === 0) return [];
    return await db.insert(suppliers).values(supplierList).returning();
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

  async getWarehouseInventoryWithProducts(warehouseId: string): Promise<Array<InventoryLevel & { product: Product }>> {
    const results = await db
      .select({
        id: inventoryLevels.id,
        productId: inventoryLevels.productId,
        warehouseId: inventoryLevels.warehouseId,
        quantity: inventoryLevels.quantity,
        row: inventoryLevels.row,
        shelf: inventoryLevels.shelf,
        updatedAt: inventoryLevels.updatedAt,
        product: products,
      })
      .from(inventoryLevels)
      .innerJoin(products, eq(inventoryLevels.productId, products.id))
      .where(eq(inventoryLevels.warehouseId, warehouseId))
      .orderBy(inventoryLevels.row, inventoryLevels.shelf, products.name);
    
    return results.map(row => ({
      id: row.id,
      productId: row.productId,
      warehouseId: row.warehouseId,
      quantity: row.quantity,
      row: row.row,
      shelf: row.shelf,
      updatedAt: row.updatedAt,
      product: row.product,
    }));
  }

  async getLowStockAlerts(): Promise<Array<InventoryLevel & { product: Product }>> {
    const results = await db
      .select({
        id: inventoryLevels.id,
        productId: inventoryLevels.productId,
        warehouseId: inventoryLevels.warehouseId,
        quantity: inventoryLevels.quantity,
        row: inventoryLevels.row,
        shelf: inventoryLevels.shelf,
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
      row: row.row,
      shelf: row.shelf,
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
          row: data.row,
          shelf: data.shelf,
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

  async bulkUpdateInventoryLevels(levels: InsertInventoryLevel[]): Promise<InventoryLevel[]> {
    if (levels.length === 0) return [];
    
    const results: InventoryLevel[] = [];
    for (const level of levels) {
      const result = await this.updateInventoryLevel(level);
      results.push(result);
    }
    return results;
  }

  async getAllInventoryLevels(): Promise<InventoryLevel[]> {
    return await db.select().from(inventoryLevels);
  }

  async getAllInventoryWithDetails() {
    const results = await db
      .select({
        productId: products.id,
        productName: products.name,
        productSku: products.sku,
        warehouseId: warehouses.id,
        warehouseName: warehouses.name,
        warehouseLocation: warehouses.location,
        quantity: inventoryLevels.quantity,
        row: inventoryLevels.row,
        shelf: inventoryLevels.shelf,
        lowStockThreshold: products.lowStockThreshold,
      })
      .from(inventoryLevels)
      .innerJoin(products, eq(inventoryLevels.productId, products.id))
      .innerJoin(warehouses, eq(inventoryLevels.warehouseId, warehouses.id));
    
    return results;
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  async getRecentMessages(limit: number = 50): Promise<Array<Message & { user: User }>> {
    const results = await db
      .select({
        message: messages,
        user: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(sql`${messages.recipientId} IS NULL`)
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    
    return results.map(row => ({
      ...row.message,
      user: row.user,
    }));
  }

  async getConversationMessages(userId: string, otherUserId: string, limit: number = 100): Promise<Array<Message & { user: User; recipient: User | null }>> {
    const messageList = await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.userId, userId),
            eq(messages.recipientId, otherUserId)
          ),
          and(
            eq(messages.userId, otherUserId),
            eq(messages.recipientId, userId)
          )
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    
    const enrichedMessages = await Promise.all(
      messageList.map(async (msg) => {
        const sender = await this.getUser(msg.userId);
        const recipient = msg.recipientId ? await this.getUser(msg.recipientId) : null;
        
        return {
          ...msg,
          user: sender!,
          recipient: recipient || null,
        };
      })
    );
    
    return enrichedMessages;
  }

  async getDashboardKPIs(): Promise<{
    totalProducts: number;
    stockValue: number;
    lowStockCount: number;
    activeWarehouses: number;
    totalOrders: number;
    pendingOrders: number;
    fulfilledOrders: number;
    totalRevenue: string;
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

    const [totalOrdersResult] = await db
      .select({ count: count() })
      .from(orders);

    const [pendingOrdersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "pending"));

    const [fulfilledOrdersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "fulfilled"));

    const [totalRevenueResult] = await db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(eq(orders.status, "fulfilled"));

    return {
      totalProducts: productCount.count,
      stockValue: Number(totalInventory.total) || 0,
      lowStockCount: lowStockItems.length,
      activeWarehouses: activeWarehouseCount.count,
      totalOrders: totalOrdersResult.count,
      pendingOrders: pendingOrdersResult.count,
      fulfilledOrders: fulfilledOrdersResult.count,
      totalRevenue: totalRevenueResult.total || "0",
    };
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  async getAllOrders(): Promise<Array<Order & { customer: Customer; user: User }>> {
    const orderList = await db.select().from(orders).orderBy(desc(orders.createdAt));
    
    const enrichedOrders = await Promise.all(
      orderList.map(async (order) => {
        const customer = await this.getCustomer(order.customerId);
        const user = await this.getUser(order.userId);
        
        return {
          ...order,
          customer: customer!,
          user: user!,
        };
      })
    );
    
    return enrichedOrders;
  }

  async getOrder(id: string): Promise<(Order & { customer: Customer; user: User; items: Array<OrderItem & { product: Product; warehouse: Warehouse }> }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    if (!order) return undefined;
    
    const customer = await this.getCustomer(order.customerId);
    const user = await this.getUser(order.userId);
    
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await this.getProduct(item.productId);
        const warehouse = await this.getWarehouse(item.warehouseId);
        
        return {
          ...item,
          product: product!,
          warehouse: warehouse!,
        };
      })
    );
    
    return {
      ...order,
      customer: customer!,
      user: user!,
      items: enrichedItems,
    };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    if (items.length > 0) {
      await db.insert(orderItems).values(items);
    }
    
    return newOrder;
  }

  async updateOrderStatus(id: string, status: "pending" | "processing" | "fulfilled" | "cancelled"): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async fulfillOrder(id: string, userId: string): Promise<void> {
    const order = await this.getOrder(id);
    
    if (!order || order.status === 'fulfilled') {
      return;
    }
    
    for (const item of order.items) {
      const [currentInventory] = await db
        .select()
        .from(inventoryLevels)
        .where(
          and(
            eq(inventoryLevels.productId, item.productId),
            eq(inventoryLevels.warehouseId, item.warehouseId)
          )
        );
      
      if (currentInventory) {
        await db
          .update(inventoryLevels)
          .set({
            quantity: currentInventory.quantity - item.quantity,
            updatedAt: new Date(),
          })
          .where(eq(inventoryLevels.id, currentInventory.id));
      }
      
      await this.createStockMovement({
        productId: item.productId,
        warehouseId: item.warehouseId,
        type: 'out',
        quantity: item.quantity,
        notes: `Order #${order.orderNumber} fulfilled`,
        userId,
      });
    }
    
    await this.updateOrderStatus(id, 'fulfilled');
  }

  async getOrdersByCustomer(customerId: string): Promise<Array<Order & { user: User }>> {
    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));
    
    const enrichedOrders = await Promise.all(
      orderList.map(async (order) => {
        const user = await this.getUser(order.userId);
        
        return {
          ...order,
          user: user!,
        };
      })
    );
    
    return enrichedOrders;
  }
}

export const storage = new DatabaseStorage();
