import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Plus, Package, Eye, Loader2 } from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Order, Customer, Product, Warehouse } from "@shared/schema";

const orderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.string().min(1, "Unit price is required"),
  subtotal: z.string().min(1, "Subtotal is required"),
});

const createOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

type CreateOrderData = z.infer<typeof createOrderSchema>;

interface OrderWithDetails extends Order {
  customer: Customer;
  user: { username: string };
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

export default function Orders() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: orders, isLoading: ordersLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const form = useForm<CreateOrderData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerId: "",
      notes: "",
      items: [
        {
          productId: "",
          warehouseId: "",
          quantity: 1,
          unitPrice: "0",
          subtotal: "0",
        },
      ],
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CreateOrderData) => {
      const totalAmount = data.items
        .reduce((sum, item) => sum + parseFloat(item.subtotal), 0)
        .toFixed(2);

      return apiRequest("POST", "/api/orders", {
        ...data,
        totalAmount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Order created",
        description: "Order has been created successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create order",
      });
    },
  });

  const onSubmit = (data: CreateOrderData) => {
    createOrderMutation.mutate(data);
  };

  const addItem = () => {
    const items = form.getValues("items");
    form.setValue("items", [
      ...items,
      {
        productId: "",
        warehouseId: "",
        quantity: 1,
        unitPrice: "0",
        subtotal: "0",
      },
    ]);
  };

  const removeItem = (index: number) => {
    const items = form.getValues("items");
    if (items.length > 1) {
      form.setValue(
        "items",
        items.filter((_, i) => i !== index)
      );
    }
  };

  const updateItemSubtotal = (index: number) => {
    const items = form.getValues("items");
    const item = items[index];
    const subtotal = (item.quantity * parseFloat(item.unitPrice || "0")).toFixed(2);
    form.setValue(`items.${index}.subtotal`, subtotal);
  };

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and fulfillment</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-order">
              <Plus className="h-4 w-4" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers?.map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={customer.id}
                              data-testid={`option-customer-${customer.id}`}
                            >
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Order Items</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      data-testid="button-add-item"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </div>

                  {form.watch("items").map((_, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.productId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product</FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    updateItemSubtotal(index);
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger data-testid={`select-product-${index}`}>
                                      <SelectValue placeholder="Select product" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {products?.map((product) => (
                                      <SelectItem
                                        key={product.id}
                                        value={product.id}
                                        data-testid={`option-product-${product.id}`}
                                      >
                                        {product.name} - {product.sku}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.warehouseId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Warehouse</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid={`select-warehouse-${index}`}>
                                      <SelectValue placeholder="Select warehouse" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {warehouses?.map((warehouse) => (
                                      <SelectItem
                                        key={warehouse.id}
                                        value={warehouse.id}
                                        data-testid={`option-warehouse-${warehouse.id}`}
                                      >
                                        {warehouse.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(parseInt(e.target.value) || 0);
                                      updateItemSubtotal(index);
                                    }}
                                    data-testid={`input-quantity-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unit Price</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      updateItemSubtotal(index);
                                    }}
                                    data-testid={`input-unit-price-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.subtotal`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subtotal</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    disabled
                                    data-testid={`text-subtotal-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {form.watch("items").length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeItem(index)}
                            data-testid={`button-remove-item-${index}`}
                          >
                            Remove Item
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Additional order notes"
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createOrderMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createOrderMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Create Order
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {orders?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          orders?.map((order) => (
            <Card key={order.id} className="hover-elevate" data-testid={`card-order-${order.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg" data-testid={`text-order-number-${order.id}`}>
                      {order.orderNumber}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {order.customer.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(order.status)} data-testid={`badge-status-${order.id}`}>
                      {order.status}
                    </Badge>
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-view-order-${order.id}`}>
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Amount</p>
                    <p className="font-semibold" data-testid={`text-total-${order.id}`}>
                      ${parseFloat(order.totalAmount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created By</p>
                    <p className="font-semibold">{order.user.username}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-semibold">
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Updated</p>
                    <p className="font-semibold">
                      {format(new Date(order.updatedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                {order.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
