import { useRef, useEffect, useState } from "react";
// @ts-ignore - bwip-js types may not be available
import bwipjs from "bwip-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarcodeGeneratorProps {
  value: string;
  productName: string;
  onClose?: () => void;
}

export function BarcodeGenerator({ value, productName, onClose }: BarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    try {
      setError(null);
      bwipjs.toCanvas(canvasRef.current, {
        bcid: 'code128',
        text: value,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });
    } catch (err) {
      console.error("Barcode generation error:", err);
      setError("Failed to generate barcode. Please check the barcode value.");
    }
  }, [value]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const filename = `${productName.replace(/[^a-z0-9]/gi, '_')}_${value}.png`;
      link.download = filename;
      link.href = url;
      link.click();

      toast({
        title: "Barcode Downloaded",
        description: `Saved as ${filename}`,
      });
    } catch (err) {
      console.error("Download error:", err);
      toast({
        title: "Download Failed",
        description: "Could not download the barcode image",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Barcode for {productName}</h3>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-barcode"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {error ? (
          <div className="text-center p-8 text-destructive">
            <p>{error}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-md">
              <canvas ref={canvasRef} data-testid="canvas-barcode" />
            </div>
            <p className="text-sm text-muted-foreground">{value}</p>
            <Button
              onClick={handleDownload}
              data-testid="button-download-barcode"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download as PNG
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
