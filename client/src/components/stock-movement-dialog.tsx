import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product, Warehouse } from "@shared/schema";

interface StockMovementDialogProps {
  trigger: React.ReactNode;
  movementType: "in" | "out" | "transfer";
}

export function StockMovementDialog({ trigger, movementType }: StockMovementDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    product: "",
    quantity: "",
    warehouse: "",
    targetWarehouse: "",
    notes: "",
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: open,
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
    enabled: open,
  });

  const createMovement = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/stock-movements", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      toast({
        title: "Success",
        description: "Stock movement recorded successfully",
      });
      setOpen(false);
      setFormData({ product: "", quantity: "", warehouse: "", targetWarehouse: "", notes: "" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to record stock movement",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const movementData: any = {
      productId: formData.product,
      warehouseId: formData.warehouse,
      type: movementType,
      quantity: parseInt(formData.quantity),
      notes: formData.notes || undefined,
    };

    if (movementType === "transfer" && formData.targetWarehouse) {
      movementData.targetWarehouseId = formData.targetWarehouse;
    }

    createMovement.mutate(movementData);
  };

  const titles = {
    in: "Record Stock In",
    out: "Record Stock Out",
    transfer: "Transfer Stock",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{titles[movementType]}</DialogTitle>
            <DialogDescription>
              Enter the details for this stock movement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={formData.product}
                onValueChange={(value) => setFormData({ ...formData, product: value })}
              >
                <SelectTrigger id="product" data-testid="select-product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                data-testid="input-quantity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">{movementType === "transfer" ? "From Warehouse" : "Warehouse"}</Label>
              <Select
                value={formData.warehouse}
                onValueChange={(value) => setFormData({ ...formData, warehouse: value })}
              >
                <SelectTrigger id="warehouse" data-testid="select-warehouse">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses?.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {movementType === "transfer" && (
              <div className="space-y-2">
                <Label htmlFor="targetWarehouse">To Warehouse</Label>
                <Select
                  value={formData.targetWarehouse}
                  onValueChange={(value) => setFormData({ ...formData, targetWarehouse: value })}
                >
                  <SelectTrigger id="targetWarehouse" data-testid="select-target-warehouse">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={createMovement.isPending}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit-movement" disabled={createMovement.isPending}>
              {createMovement.isPending ? "Recording..." : "Record Movement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
