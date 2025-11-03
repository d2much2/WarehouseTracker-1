import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MoreHorizontal } from "lucide-react";
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
import { AddSupplierDialog } from "@/components/add-supplier-dialog";
import { CSVUploadDialog } from "@/components/csv-upload-dialog";
import { CsvExportButton } from "@/components/csv-export-button";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Supplier } from "@shared/schema";
import { VoiceInputButton } from "@/components/voice-input-button";

export default function Suppliers() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  const { data: suppliers, isLoading, error } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    retry: false,
  });

  const deleteSupplier = useMutation({
    mutationFn: async (supplierId: string) => {
      await apiRequest("DELETE", `/api/suppliers/${supplierId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
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
        description: error.message || "Failed to delete supplier",
        variant: "destructive",
      });
    },
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

  const filteredSuppliers = suppliers?.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (supplierToDelete) {
      deleteSupplier.mutate(supplierToDelete.id);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSupplierToEdit(supplier);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage your supplier contacts and information</p>
        </div>
        <div className="flex gap-2">
          <CSVUploadDialog type="suppliers" invalidateKey="/api/suppliers" />
          <CsvExportButton 
            endpoint="/api/csv/download/suppliers"
            filename="suppliers.csv"
            size="sm"
          />
          <AddSupplierDialog
            trigger={
              <Button data-testid="button-add-supplier">
                <Plus className="h-4 w-4" />
                Add Supplier
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 flex-1"
              data-testid="input-search-suppliers"
            />
            <VoiceInputButton onTranscript={(text) => setSearchTerm(prev => prev + (prev ? ' ' : '') + text)} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : error ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-sm text-destructive">Failed to load suppliers. Please try again.</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {searchTerm ? "No suppliers found matching your search." : "No suppliers yet. Add your first supplier to get started."}
          </p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Supplier Name</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Contact Person</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Email</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Phone</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Address</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell className="text-muted-foreground">{supplier.contactPerson || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{supplier.email || "-"}</TableCell>
                  <TableCell className="font-mono text-sm">{supplier.phone || "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{supplier.address || "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-menu-${supplier.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(supplier)} data-testid={`button-edit-${supplier.id}`}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(supplier)}
                          className="text-destructive"
                          data-testid={`button-delete-${supplier.id}`}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the supplier "{supplierToDelete?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteSupplier.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteSupplier.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {supplierToEdit && (
        <AddSupplierDialog
          trigger={<div />}
          supplier={supplierToEdit}
          onSuccess={() => setSupplierToEdit(null)}
        />
      )}
    </div>
  );
}
