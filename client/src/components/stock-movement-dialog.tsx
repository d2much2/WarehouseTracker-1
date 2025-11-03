import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertStockMovementSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Scan } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product, Warehouse } from "@shared/schema";
import { VoiceInputButton } from "@/components/voice-input-button";
import { BarcodeScanner } from "@/components/barcode-scanner";

interface StockMovementDialogProps {
  trigger: React.ReactNode;
  movementType: "in" | "out" | "transfer";
}

export function StockMovementDialog({ trigger, movementType }: StockMovementDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const formSchema = insertStockMovementSchema.omit({ userId: true }).extend({
    type: z.literal(movementType),
  }).refine((data) => {
    if (data.type === "transfer") {
      return !!data.targetWarehouseId;
    }
    return true;
  }, {
    message: "Target warehouse is required for transfers",
    path: ["targetWarehouseId"],
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: movementType,
      productId: undefined as any,
      warehouseId: undefined as any,
      quantity: 1,
      row: undefined,
      shelf: undefined,
      targetWarehouseId: undefined,
      notes: undefined,
    },
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
    mutationFn: async (data: FormValues) => {
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
      form.reset();
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

  const handleBarcodeScanned = (code: string) => {
    if (!products || products.length === 0) {
      toast({
        title: "Loading Products",
        description: "Please wait for products to load before scanning",
        variant: "destructive",
      });
      setShowScanner(false);
      return;
    }

    const product = products.find(
      (p) => p.barcode === code || p.qrCode === code
    );
    
    if (product) {
      form.setValue("productId", product.id);
      setShowScanner(false);
      toast({
        title: "Product Found",
        description: `${product.name} (${product.sku}) selected`,
      });
    } else {
      toast({
        title: "Product Not Found",
        description: `No product found with code: ${code}`,
        variant: "destructive",
      });
      setShowScanner(false);
    }
  };

  const onSubmit = (data: FormValues) => {
    console.log("Submitting stock movement:", data);
    createMovement.mutate(data);
  };
  
  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast({
      title: "Validation Error",
      description: "Please fill in all required fields correctly.",
      variant: "destructive",
    });
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)}>
            <DialogHeader>
              <DialogTitle>{titles[movementType]}</DialogTitle>
              <DialogDescription>
                Enter the details for this stock movement.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {showScanner && products && products.length > 0 && (
                <BarcodeScanner
                  onScan={handleBarcodeScanned}
                  onClose={() => setShowScanner(false)}
                />
              )}
              
              {showScanner && (!products || products.length === 0) && (
                <div className="border rounded-md p-4 text-center">
                  <p className="text-sm text-muted-foreground">Loading products...</p>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <div className="flex gap-2">
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger className="flex-1" data-testid="select-product">
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowScanner(!showScanner)}
                        data-testid="button-scan-barcode"
                        title="Scan barcode"
                      >
                        <Scan className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{movementType === "transfer" ? "From Warehouse" : "Warehouse"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger data-testid="select-warehouse">
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses?.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {movementType === "transfer" && (
                <FormField
                  control={form.control}
                  name="targetWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Warehouse</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-target-warehouse">
                            <SelectValue placeholder="Select destination" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses?.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="row"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Row (Optional)</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., A1"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-row"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                field.onChange('');
                              }
                            }}
                          />
                          <VoiceInputButton onTranscript={(text) => field.onChange(field.value + (field.value ? ' ' : '') + text)} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shelf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shelf (Optional)</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., S3"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-shelf"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                field.onChange('');
                              }
                            }}
                          />
                          <VoiceInputButton onTranscript={(text) => field.onChange(field.value + (field.value ? ' ' : '') + text)} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes..."
                        {...field}
                        value={field.value || ""}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset();
                }}
                disabled={createMovement.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit-movement" disabled={createMovement.isPending}>
                {createMovement.isPending ? "Recording..." : "Record Movement"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
