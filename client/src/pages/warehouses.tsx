import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WarehouseCard } from "@/components/warehouse-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { AddWarehouseDialog } from "@/components/add-warehouse-dialog";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Warehouse } from "@shared/schema";

export default function Warehouses() {
  const { toast } = useToast();
  const [warehouseToEdit, setWarehouseToEdit] = useState<Warehouse | null>(null);

  const { data: warehouses, isLoading, error } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
    retry: false,
  });

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Warehouses</h1>
          <p className="text-muted-foreground mt-1">Manage warehouse locations and capacity</p>
        </div>
        <AddWarehouseDialog
          trigger={
            <Button data-testid="button-add-warehouse">
              <Plus className="h-4 w-4 mr-2" />
              Add Warehouse
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : error ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-sm text-destructive">Failed to load warehouses. Please try again.</p>
        </div>
      ) : warehouses && warehouses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {warehouses.map((warehouse) => (
            <WarehouseCard
              key={warehouse.id}
              warehouse={warehouse}
              onEdit={(w) => setWarehouseToEdit(w)}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center">
          <p className="text-sm text-muted-foreground">No warehouses found. Add your first warehouse to get started.</p>
        </div>
      )}

      {warehouseToEdit && (
        <AddWarehouseDialog
          trigger={<div />}
          warehouse={warehouseToEdit}
          onSuccess={() => setWarehouseToEdit(null)}
        />
      )}
    </div>
  );
}
