import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, Loader2, XCircle } from "lucide-react";
import { Link } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Order, Customer, OrderItem, Product, Warehouse } from "@shared/schema";

interface OrderWithDetails extends Order {
  customer: Customer;
  user: { username: string };
  items: Array<OrderItem & { product: Product; warehouse: Warehouse }>;
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "fulfilled":
      return "default";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: order, isLoading } = useQuery<OrderWithDetails>({
    queryKey: ["/api/orders", id],
  });

  const fulfillOrderMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/orders/${id}/fulfill`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      toast({
        title: "Order fulfilled",
        description: "Order has been fulfilled and inventory has been updated",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fulfill order",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("PATCH", `/api/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status updated",
        description: "Order status has been updated",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Order not found</p>
        <Link href="/orders">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-order-number">
            Order {order.orderNumber}
          </h1>
          <p className="text-muted-foreground">Order details and fulfillment</p>
        </div>
        <Badge variant={getStatusBadgeVariant(order.status)} data-testid="badge-status">
          {order.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-semibold" data-testid="text-customer-name">
                {order.customer.name}
              </p>
              <p className="text-sm text-muted-foreground">{order.customer.email}</p>
              <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold" data-testid="text-total-amount">
                ${parseFloat(order.totalAmount).toFixed(2)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="font-semibold">{order.user.username}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize" data-testid="text-status">
                  {order.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-semibold">
                  {format(new Date(order.createdAt), "MMM d, yyyy HH:mm")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="font-semibold">
                  {format(new Date(order.updatedAt), "MMM d, yyyy HH:mm")}
                </p>
              </div>
            </div>
            {order.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.status === "pending" && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => updateStatusMutation.mutate("processing")}
                disabled={updateStatusMutation.isPending}
                data-testid="button-mark-processing"
              >
                {updateStatusMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Mark as Processing
              </Button>
            )}

            {(order.status === "pending" || order.status === "processing") && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full"
                    disabled={fulfillOrderMutation.isPending}
                    data-testid="button-fulfill-order"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Fulfill Order
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Fulfill Order?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reduce inventory levels and create stock movement records.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-fulfill">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => fulfillOrderMutation.mutate()}
                      data-testid="button-confirm-fulfill"
                    >
                      {fulfillOrderMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Fulfill Order
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {(order.status === "pending" || order.status === "processing") && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full"
                    variant="destructive"
                    disabled={updateStatusMutation.isPending}
                    data-testid="button-cancel-order"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Order
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark the order as cancelled. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-cancel">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => updateStatusMutation.mutate("cancelled")}
                      data-testid="button-confirm-cancel"
                    >
                      Cancel Order
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {order.status === "fulfilled" && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-semibold">Order Fulfilled</p>
                <p className="text-xs text-muted-foreground">
                  Inventory has been updated
                </p>
              </div>
            )}

            {order.status === "cancelled" && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                <p className="text-sm font-semibold">Order Cancelled</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg"
                data-testid={`item-${index}`}
              >
                <div className="flex-1">
                  <p className="font-semibold" data-testid={`text-product-name-${index}`}>
                    {item.product.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    SKU: {item.product.sku}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Warehouse: {item.warehouse.name}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Quantity: <span className="font-semibold" data-testid={`text-quantity-${index}`}>{item.quantity}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Unit Price: ${parseFloat(item.unitPrice).toFixed(2)}
                  </p>
                  <p className="font-semibold" data-testid={`text-subtotal-${index}`}>
                    ${parseFloat(item.subtotal).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
