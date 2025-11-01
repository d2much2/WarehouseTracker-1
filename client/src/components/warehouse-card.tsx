import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPin, Package, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Warehouse } from "@shared/schema";

interface WarehouseCardProps {
  warehouse: Warehouse;
  onEdit: (warehouse: Warehouse) => void;
}

const statusConfig = {
  active: { label: "Active", color: "bg-green-500" },
  maintenance: { label: "Maintenance", color: "bg-yellow-500" },
  inactive: { label: "Inactive", color: "bg-gray-500" },
};

export function WarehouseCard({ warehouse, onEdit }: WarehouseCardProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: inventoryData } = useQuery({
    queryKey: ["/api/inventory/warehouse", warehouse.id],
    retry: false,
  });

  const deleteWarehouse = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/warehouses/${warehouse.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/kpis"] });
      toast({
        title: "Success",
        description: "Warehouse deleted successfully",
      });
      setDeleteDialogOpen(false);
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
        description: error.message || "Failed to delete warehouse",
        variant: "destructive",
      });
    },
  });

  const totalProducts = inventoryData?.length || 0;
  const currentOccupancy = inventoryData?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
  const occupancyPercentage = warehouse.capacity > 0 ? (currentOccupancy / warehouse.capacity) * 100 : 0;

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteWarehouse.mutate();
  };

  return (
    <>
      <Card className="hover-elevate" data-testid={`card-warehouse-${warehouse.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg font-semibold">{warehouse.name}</CardTitle>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${statusConfig[warehouse.status].color}`} />
              <span className="text-xs text-muted-foreground">{statusConfig[warehouse.status].label}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-menu-${warehouse.id}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onEdit(warehouse)} data-testid={`button-edit-${warehouse.id}`}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                    data-testid={`button-delete-${warehouse.id}`}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{warehouse.location}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Products</p>
              <p className="text-2xl font-semibold mt-1" data-testid={`text-products-${warehouse.id}`}>{totalProducts}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Stock</p>
              <p className="text-2xl font-semibold mt-1" data-testid={`text-stock-${warehouse.id}`}>{currentOccupancy}</p>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Capacity</span>
              </div>
              <span className="text-sm font-mono">{occupancyPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={occupancyPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {currentOccupancy.toLocaleString()} / {warehouse.capacity.toLocaleString()} units
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the warehouse "{warehouse.name}".
              This action cannot be undone and will also delete all inventory levels associated with this warehouse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteWarehouse.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteWarehouse.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
