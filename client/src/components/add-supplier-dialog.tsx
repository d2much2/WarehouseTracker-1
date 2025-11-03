import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertSupplierSchema, type Supplier } from "@shared/schema";
import { z } from "zod";
import { VoiceInputButton } from "@/components/voice-input-button";

const formSchema = insertSupplierSchema;

type FormData = z.infer<typeof formSchema>;

interface AddSupplierDialogProps {
  trigger: React.ReactNode;
  supplier?: Supplier;
  onSuccess?: () => void;
}

export function AddSupplierDialog({ trigger, supplier, onSuccess }: AddSupplierDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: supplier?.name || "",
      contactPerson: supplier?.contactPerson || "",
      email: supplier?.email || "",
      phone: supplier?.phone || "",
      address: supplier?.address || "",
    },
  });

  const createSupplier = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/suppliers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Success",
        description: "Supplier created successfully",
      });
      setOpen(false);
      form.reset();
      onSuccess?.();
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
        description: error.message || "Failed to create supplier",
        variant: "destructive",
      });
    },
  });

  const updateSupplier = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("PATCH", `/api/suppliers/${supplier!.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Success",
        description: "Supplier updated successfully",
      });
      setOpen(false);
      onSuccess?.();
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
        description: error.message || "Failed to update supplier",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (supplier) {
      updateSupplier.mutate(data);
    } else {
      createSupplier.mutate(data);
    }
  };

  const isLoading = createSupplier.isPending || updateSupplier.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
          <DialogDescription>
            {supplier ? "Update supplier information below." : "Enter the details for the new supplier."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Name*</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input {...field} placeholder="ABC Supplies Co." data-testid="input-supplier-name" />
                      <VoiceInputButton onTranscript={(text) => field.onChange(field.value + (field.value ? ' ' : '') + text)} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input {...field} value={field.value || ""} placeholder="John Doe" data-testid="input-supplier-contact" />
                      <VoiceInputButton onTranscript={(text) => field.onChange(field.value + (field.value ? ' ' : '') + text)} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input {...field} value={field.value || ""} type="email" placeholder="contact@supplier.com" data-testid="input-supplier-email" />
                        <VoiceInputButton onTranscript={(text) => field.onChange(field.value + (field.value ? ' ' : '') + text)} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input {...field} value={field.value || ""} placeholder="+1 234 567 8900" data-testid="input-supplier-phone" />
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Enter supplier address"
                      rows={3}
                      data-testid="input-supplier-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
                data-testid="button-cancel-supplier"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} data-testid="button-save-supplier">
                {isLoading ? "Saving..." : supplier ? "Update Supplier" : "Create Supplier"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
