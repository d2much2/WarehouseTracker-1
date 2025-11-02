import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Search, Package, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Warehouse, InventoryLevel, Product } from "@shared/schema";

type InventoryWithProduct = InventoryLevel & { product: Product };

export default function WarehouseDetail() {
  const [, params] = useRoute("/warehouses/:id");
  const warehouseId = params?.id;
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: warehouse, isLoading: isLoadingWarehouse, error: warehouseError } = useQuery<Warehouse>({
    queryKey: ["/api/warehouses", warehouseId],
    enabled: !!warehouseId,
    retry: false,
  });

  const { data: inventory, isLoading: isLoadingInventory, error: inventoryError } = useQuery<InventoryWithProduct[]>({
    queryKey: ["/api/warehouses", warehouseId, "inventory"],
    enabled: !!warehouseId,
    retry: false,
  });

  if ((warehouseError && isUnauthorizedError(warehouseError as Error)) || 
      (inventoryError && isUnauthorizedError(inventoryError as Error))) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  const filteredInventory = inventory?.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.product.name.toLowerCase().includes(query) ||
      item.product.sku.toLowerCase().includes(query) ||
      (item.row || "").toLowerCase().includes(query) ||
      (item.shelf || "").toLowerCase().includes(query)
    );
  }) || [];

  const groupedByRow = filteredInventory.reduce((acc, item) => {
    const rowKey = item.row || "Unassigned";
    if (!acc[rowKey]) {
      acc[rowKey] = [];
    }
    acc[rowKey].push(item);
    return acc;
  }, {} as Record<string, InventoryWithProduct[]>);

  const totalItems = inventory?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const uniqueProducts = new Set(inventory?.map(item => item.productId)).size;

  if (isLoadingWarehouse || isLoadingInventory) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/warehouses">
            <Button variant="ghost" size="sm" data-testid="button-back-warehouses">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Warehouses
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Warehouse not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/warehouses">
          <Button variant="ghost" size="sm" data-testid="button-back-warehouses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Warehouses
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-semibold">{warehouse.name}</h1>
        <p className="text-muted-foreground mt-1">{warehouse.location}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">In stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{uniqueProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Product types</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacity</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{warehouse.capacity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Maximum capacity</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Inventory by Location</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, SKU, row, shelf..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-inventory"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No matching items found" : "No inventory in this warehouse"}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedByRow)
                .sort(([a], [b]) => {
                  if (a === "Unassigned") return 1;
                  if (b === "Unassigned") return -1;
                  return a.localeCompare(b);
                })
                .map(([rowName, items]) => (
                  <div key={rowName}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-sm">
                        Row: {rowName}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {items.length} {items.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Shelf</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items
                            .sort((a, b) => {
                              if (!a.shelf && b.shelf) return 1;
                              if (a.shelf && !b.shelf) return -1;
                              if (!a.shelf && !b.shelf) return 0;
                              return a.shelf!.localeCompare(b.shelf!);
                            })
                            .map((item) => (
                              <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                                <TableCell className="font-medium">{item.product.name}</TableCell>
                                <TableCell>
                                  <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                    {item.product.sku}
                                  </code>
                                </TableCell>
                                <TableCell>
                                  {item.shelf ? (
                                    <Badge variant="secondary" className="font-mono text-xs">
                                      {item.shelf}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {item.quantity.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
