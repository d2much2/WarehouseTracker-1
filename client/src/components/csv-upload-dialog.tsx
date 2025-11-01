import { useState } from "react";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CSVUploadDialogProps {
  type: "products" | "warehouses" | "suppliers" | "inventory";
  invalidateKey: string;
}

export function CSVUploadDialog({ type, invalidateKey }: CSVUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const response = await apiRequest("POST", `/api/csv/upload/${type}`, { data });
      return response;
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: [invalidateKey] });
      
      if (type === "inventory") {
        queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      }
      
      toast({
        title: "Import successful",
        description: response.message || `Successfully imported ${parsedData.length} rows`,
      });
      setOpen(false);
      resetDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import CSV data",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setError("");

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setParsedData(results.data);
          setError("");
        } else {
          setError("CSV file is empty or invalid");
          setParsedData([]);
        }
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
        setParsedData([]);
      },
    });
  };

  const handleUpload = () => {
    if (parsedData.length === 0) {
      setError("No data to upload");
      return;
    }
    uploadMutation.mutate(parsedData);
  };

  const resetDialog = () => {
    setFile(null);
    setParsedData([]);
    setError("");
  };

  const getTypeLabel = () => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getRequiredFields = () => {
    switch (type) {
      case "products":
        return "sku, name, category";
      case "warehouses":
        return "name, location, capacity";
      case "suppliers":
        return "name";
      case "inventory":
        return "productId, warehouseId, quantity";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-upload-${type}`}>
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import {getTypeLabel()} from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import {type}. Required fields: {getRequiredFields()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                data-testid="input-csv-file"
              />
              {file && (
                <FileUp className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {parsedData.length > 0 && (
            <div className="space-y-2">
              <Label>Preview ({parsedData.length} rows)</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-auto">
                <div className="text-sm font-mono">
                  {parsedData.slice(0, 5).map((row, idx) => (
                    <div key={idx} className="mb-2 pb-2 border-b last:border-b-0">
                      {Object.entries(row).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="font-semibold">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  ))}
                  {parsedData.length > 5 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      ... and {parsedData.length - 5} more rows
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetDialog();
              }}
              data-testid="button-cancel-upload"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={parsedData.length === 0 || uploadMutation.isPending}
              data-testid="button-confirm-upload"
            >
              {uploadMutation.isPending ? "Uploading..." : `Import ${parsedData.length} rows`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
