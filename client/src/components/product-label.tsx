import { useRef, useEffect } from "react";
// @ts-ignore - bwip-js types may not be available
import bwipjs from "bwip-js";
import type { Product, Warehouse, Customer } from "@shared/schema";
import logoUrl from "@assets/proicon2/Lowes_Companies_Logo.svg.png";

interface ProductLabelProps {
  product: Product;
  warehouse?: Warehouse;
  inventory?: {
    row: string | null;
    shelf: string | null;
  };
  customer?: Customer;
}

export function ProductLabel({ product, warehouse, inventory, customer }: ProductLabelProps) {
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
    if (qrcodeCanvasRef.current) {
      try {
        const qrCodeValue = product.qrCode || product.sku;
        bwipjs.toCanvas(qrcodeCanvasRef.current, {
          bcid: 'qrcode',
          text: qrCodeValue,
          scale: 2,
          includetext: false,
        });
      } catch (err) {
        console.error("QR code generation error:", err);
      }
    }
  }, [product.qrCode, product.sku]);

  return (
    <div className="label-container border-2 border-gray-300 rounded-md p-4 bg-white text-gray-900" data-testid={`label-${product.id}`}>
      <div className="label-content space-y-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
        </div>
        
        <div className="label-header">
          <h3 className="font-bold text-lg leading-tight mb-1 text-gray-900">{product.name}</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <span className="font-medium">SKU:</span> <span className="font-mono">{product.sku}</span>
            </div>
            <div>
              <span className="font-medium">Category:</span> {product.category}
            </div>
          </div>
        </div>

        {warehouse && (
          <div className="text-xs space-y-1 border-t border-gray-300 pt-2 text-gray-800">
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

        {customer && (
          <div className="text-xs space-y-1 border-t border-gray-300 pt-2 text-gray-800">
            <div className="font-medium mb-1">Customer:</div>
            <div>{customer.name}</div>
            {customer.email && <div>{customer.email}</div>}
            {customer.phone && <div>{customer.phone}</div>}
            {customer.address && (
              <div className="text-gray-600">
                {customer.address}
                {customer.city && `, ${customer.city}`}
                {customer.state && `, ${customer.state}`}
                {customer.zipCode && ` ${customer.zipCode}`}
              </div>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-3 border-t border-gray-300 pt-3">
          <div className="flex-1">
            {product.barcode ? (
              <div className="space-y-1">
                <div className="bg-white p-2 rounded inline-block">
                  <canvas ref={barcodeCanvasRef} />
                </div>
                <p className="text-xs text-center font-mono text-gray-900">{product.barcode}</p>
              </div>
            ) : (
              <div className="text-xs text-gray-500 text-center py-4">
                No barcode
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            <div className="space-y-1">
              <div className="bg-white p-2 rounded inline-block">
                <canvas ref={qrcodeCanvasRef} />
              </div>
              <p className="text-xs text-center text-gray-900">
                {product.qrCode ? "QR Code" : "SKU QR"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
