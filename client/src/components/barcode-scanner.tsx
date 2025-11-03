import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Scan, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isCleaningUpRef = useRef(false);
  const { toast } = useToast();

  const cleanupCamera = async () => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (err) {
        console.error("Error stopping controls:", err);
      }
      controlsRef.current = null;
    }

    if (streamRef.current) {
      await Promise.all(
        streamRef.current.getTracks().map(track => 
          new Promise<void>(resolve => {
            track.stop();
            requestAnimationFrame(() => resolve());
          })
        )
      );
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    isCleaningUpRef.current = false;
  };

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    const startScanning = async () => {
      try {
        setIsScanning(true);
        setCameraError(null);

        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setCameraError("No camera found on this device");
          setIsScanning(false);
          return;
        }

        const backCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('environment')
        );
        const selectedDeviceId = backCamera?.deviceId || videoInputDevices[0].deviceId;

        const controls = await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current!,
          async (result, error) => {
            if (result) {
              const barcodeValue = result.getText();
              toast({
                title: "Code Scanned",
                description: `Found: ${barcodeValue}`,
              });
              
              await cleanupCamera();
              
              requestAnimationFrame(() => {
                onScan(barcodeValue);
                setIsScanning(false);
                onClose();
              });
            }
          }
        );

        controlsRef.current = controls;

        if (videoRef.current && videoRef.current.srcObject) {
          streamRef.current = videoRef.current.srcObject as MediaStream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        setCameraError("Failed to access camera. Please allow camera permissions.");
        setIsScanning(false);
      }
    };

    startScanning();

    return () => {
      cleanupCamera();
    };
  }, [onScan, onClose, toast]);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            <h3 className="font-semibold">Scan Barcode or QR Code</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              await cleanupCamera();
              requestAnimationFrame(() => {
                setIsScanning(false);
                onClose();
              });
            }}
            data-testid="button-close-scanner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {cameraError ? (
          <div className="text-center p-8 text-destructive">
            <p>{cameraError}</p>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full rounded-lg bg-black"
              style={{ maxHeight: "400px" }}
              data-testid="video-barcode-scanner"
            />
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-primary rounded-lg w-64 h-48 opacity-50"></div>
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground text-center">
          Position the barcode or QR code within the frame to scan
        </p>
      </div>
    </Card>
  );
}
