import { useRef, useEffect } from "react";
// @ts-ignore - bwip-js types may not be available
import bwipjs from "bwip-js";
import type { Product, Warehouse } from "@shared/schema";
import logoUrl from "@assets/proicon2/Lowes_Companies_Logo.svg.png";

interface ProductLabelProps {
  product: Product;
  warehouse?: Warehouse;
  inventory?: {
    row: string | null;
    shelf: string | null;
  };
}

export function ProductLabel({ product, warehouse, inventory }: ProductLabelProps) {
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const qrcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (barcodeCanvasRef.current && product.barcode) {
      try {
        bwipjs.toCanvas(barcodeCanvasRef.current, {
          bcid: 'code128',
          text: product.barcode,
          scale: 2,
          height: 8,
          includetext: true,
          textxalign: 'center',
        });
      } catch (err) {
        console.error("Barcode generation error:", err);
      }
    }
  }, [product.barcode]);

  useEffect(() => {
    if (qrcodeCanvasRef.current && product.qrCode) {
      try {
        bwipjs.toCanvas(qrcodeCanvasRef.current, {
          bcid: 'qrcode',
          text: product.qrCode,
          scale: 2,
          includetext: false,
        });
      } catch (err) {
        console.error("QR code generation error:", err);
      }
    }
  }, [product.qrCode]);

  return (
    <div className="label-container border-2 border-border rounded-md p-4 bg-background" data-testid={`label-${product.id}`}>
      <div className="label-content space-y-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
        </div>
        
        <div className="label-header">
          <h3 className="font-bold text-lg leading-tight mb-1">{product.name}</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">SKU:</span> <span className="font-mono">{product.sku}</span>
            </div>
            <div>
              <span className="font-medium">Category:</span> {product.category}
            </div>
          </div>
        </div>

        {warehouse && (
          <div className="text-xs space-y-1 border-t pt-2">
            <div>
              <span className="font-medium">Warehouse:</span> {warehouse.name}
            </div>
            {inventory && (inventory.row || inventory.shelf) && (
              <div className="font-mono">
                <span className="font-medium">Location:</span> Row {inventory.row || "—"} / Shelf {inventory.shelf || "—"}
              </div>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-3 border-t pt-3">
          <div className="flex-1">
            {product.barcode ? (
              <div className="space-y-1">
                <div className="bg-white p-2 rounded inline-block">
                  <canvas ref={barcodeCanvasRef} />
                </div>
                <p className="text-xs text-center font-mono">{product.barcode}</p>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                No barcode
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            {product.qrCode ? (
              <div className="space-y-1">
                <div className="bg-white p-2 rounded inline-block">
                  <canvas ref={qrcodeCanvasRef} />
                </div>
                <p className="text-xs text-center">QR Code</p>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                No QR code
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
