import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Search, ScanBarcode, Plus, Minus, Package, MapPin, AlertTriangle, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BarcodeScanner } from "@/components/barcode-scanner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  row: string | null;
  shelf: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    lowStockThreshold: number;
  };
  warehouse: {
    id: string;
    name: string;
    location: string;
  };
}

export default function MobileInventory() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [updateQuantity, setUpdateQuantity] = useState(0);

  const { data: inventory, isLoading, refetch } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/all-with-details"],
    enabled: true,
  });

  const {
    containerRef,
    pullDistance,
    isRefreshing,
    refreshIndicatorOpacity,
    refreshIndicatorRotation,
    shouldTrigger,
  } = usePullToRefresh({
    onRefresh: async () => {
      await refetch();
      toast({
        title: "Refreshed",
        description: "Inventory data has been updated",
      });
    },
    enabled: true,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ type, quantity }: { type: "in" | "out"; quantity: number }) => {
      if (!selectedItem) throw new Error("No item selected");
      
      return await apiRequest("POST", "/api/stock-movements", {
        productId: selectedItem.productId,
        warehouseId: selectedItem.warehouseId,
        type,
        quantity: Math.abs(quantity),
        row: selectedItem.row,
        shelf: selectedItem.shelf,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/all-with-details"] });
      toast({
        title: "Stock Updated",
        description: "Inventory has been updated successfully",
      });
      setSelectedItem(null);
      setUpdateQuantity(0);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update inventory",
        variant: "destructive",
      });
    },
  });

  const handleBarcodeDetected = (barcode: string) => {
    setScannerOpen(false);
    setSearchQuery(barcode);
  };

  const filteredInventory = inventory?.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.product.name.toLowerCase().includes(query) ||
      item.product.sku.toLowerCase().includes(query) ||
      item.product.barcode?.toLowerCase().includes(query) ||
      item.warehouse.name.toLowerCase().includes(query)
    );
  });

  const handleQuickUpdate = (type: "in" | "out") => {
    if (updateQuantity > 0) {
      updateMutation.mutate({ type, quantity: updateQuantity });
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen pb-20 overflow-auto">
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center py-4 transition-opacity"
          style={{ opacity: refreshIndicatorOpacity }}
        >
          <RefreshCw
            className={`h-6 w-6 text-primary ${shouldTrigger ? "animate-spin" : ""}`}
            style={{ transform: `rotate(${refreshIndicatorRotation}deg)` }}
          />
          <span className="ml-2 text-sm text-muted-foreground">
            {shouldTrigger ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>
      )}
      
      <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-3">
        <h1 className="text-2xl font-semibold">Quick Inventory</h1>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-inventory"
            />
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setScannerOpen(true)}
            data-testid="button-open-scanner"
          >
            <ScanBarcode className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </>
        ) : filteredInventory && filteredInventory.length > 0 ? (
          filteredInventory.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover-elevate active-elevate-2"
              onClick={() => {
                setSelectedItem(item);
                setUpdateQuantity(0);
              }}
              data-testid={`card-inventory-${item.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base mb-1">{item.product.name}</CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">{item.product.sku}</p>
                  </div>
                  <Badge
                    variant={item.quantity <= item.product.lowStockThreshold ? "destructive" : "default"}
                    className="font-mono text-base px-3 py-1"
                  >
                    {item.quantity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{item.warehouse.name}</span>
                </div>
                {(item.row || item.shelf) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="font-mono">
                      Row: {item.row || "—"} / Shelf: {item.shelf || "—"}
                    </span>
                  </div>
                )}
                {item.quantity <= item.product.lowStockThreshold && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Low Stock Alert (Threshold: {item.product.lowStockThreshold})</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No inventory items found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try a different search term</p>
              )}
            </div>
          </Card>
        )}
      </div>

      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
            <DialogDescription>
              Position the barcode in the camera view
            </DialogDescription>
          </DialogHeader>
          <BarcodeScanner 
            onScan={handleBarcodeDetected}
            onClose={() => setScannerOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedItem?.product.name}</DialogTitle>
            <DialogDescription>
              Update stock levels for this item
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">SKU</p>
                  <p className="font-mono font-medium">{selectedItem.product.sku}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Stock</p>
                  <p className="font-mono font-medium text-lg">{selectedItem.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Warehouse</p>
                  <p className="font-medium">{selectedItem.warehouse.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-mono text-sm">
                    {selectedItem.row || "—"} / {selectedItem.shelf || "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Quick Update Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setUpdateQuantity(Math.max(0, updateQuantity - 1))}
                    data-testid="button-decrease-quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={updateQuantity}
                    onChange={(e) => setUpdateQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-center font-mono text-lg"
                    data-testid="input-update-quantity"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setUpdateQuantity(updateQuantity + 1)}
                    data-testid="button-increase-quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUpdateQuantity(5)}
                    className="flex-1"
                  >
                    +5
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUpdateQuantity(10)}
                    className="flex-1"
                  >
                    +10
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUpdateQuantity(25)}
                    className="flex-1"
                  >
                    +25
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleQuickUpdate("in")}
                  disabled={updateQuantity === 0 || updateMutation.isPending}
                  className="flex-1"
                  data-testid="button-stock-in"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Stock In
                </Button>
                <Button
                  onClick={() => handleQuickUpdate("out")}
                  disabled={updateQuantity === 0 || updateMutation.isPending}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-stock-out"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Stock Out
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
