import { useState } from "react";
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

interface StockMovementDialogProps {
  trigger: React.ReactNode;
  movementType: "in" | "out" | "transfer";
}

export function StockMovementDialog({ trigger, movementType }: StockMovementDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    product: "",
    quantity: "",
    warehouse: "",
    targetWarehouse: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Stock movement submitted:', movementType, formData);
    setOpen(false);
    setFormData({ product: "", quantity: "", warehouse: "", targetWarehouse: "", notes: "" });
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
                  <SelectItem value="prod-1">Industrial Widget A</SelectItem>
                  <SelectItem value="prod-2">Hydraulic Pump B</SelectItem>
                  <SelectItem value="prod-3">Steel Beam C</SelectItem>
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
                  <SelectItem value="wh-1">Main Warehouse</SelectItem>
                  <SelectItem value="wh-2">North Distribution Center</SelectItem>
                  <SelectItem value="wh-3">South Storage Facility</SelectItem>
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
                    <SelectItem value="wh-1">Main Warehouse</SelectItem>
                    <SelectItem value="wh-2">North Distribution Center</SelectItem>
                    <SelectItem value="wh-3">South Storage Facility</SelectItem>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit-movement">
              Record Movement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
