import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { StockMovementDialog } from "@/components/stock-movement-dialog";
import { formatDistanceToNow } from "date-fns";
import type { StockMovement } from "@shared/schema";

const movementTypeConfig = {
  in: { label: "Stock In", variant: "default" as const },
  out: { label: "Stock Out", variant: "secondary" as const },
  transfer: { label: "Transfer", variant: "outline" as const },
  adjustment: { label: "Adjustment", variant: "secondary" as const },
};

export default function Movements() {
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const queryKey = typeFilter === "all" 
    ? ["/api/stock-movements"]
    : ["/api/stock-movements", { type: typeFilter }];

  const { data: movements, isLoading, error } = useQuery<StockMovement[]>({
    queryKey,
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Stock Movements</h1>
          <p className="text-muted-foreground mt-1">View and manage stock movement history</p>
        </div>
        <div className="flex items-center gap-2">
          <StockMovementDialog
            movementType="in"
            trigger={
              <Button size="sm" data-testid="button-stock-in">
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Stock In
              </Button>
            }
          />
          <StockMovementDialog
            movementType="out"
            trigger={
              <Button size="sm" variant="outline" data-testid="button-stock-out">
                <ArrowUpFromLine className="h-4 w-4 mr-2" />
                Stock Out
              </Button>
            }
          />
          <StockMovementDialog
            movementType="transfer"
            trigger={
              <Button size="sm" variant="outline" data-testid="button-transfer-stock">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48" data-testid="select-movement-type-filter">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="in">Stock In</SelectItem>
              <SelectItem value="out">Stock Out</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : error ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-sm text-destructive">Failed to load stock movements. Please try again.</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Product ID</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Type</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Quantity</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Warehouse</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">User ID</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Date</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No stock movements found.
                  </TableCell>
                </TableRow>
              ) : (
                movements?.map((movement) => (
                  <TableRow key={movement.id} data-testid={`row-movement-${movement.id}`}>
                    <TableCell className="font-mono text-sm">{movement.productId}</TableCell>
                    <TableCell>
                      <Badge variant={movementTypeConfig[movement.type].variant}>
                        {movementTypeConfig[movement.type].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {movement.type === "out" ? "-" : "+"}{movement.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{movement.warehouseId}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{movement.userId}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(movement.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{movement.notes || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
