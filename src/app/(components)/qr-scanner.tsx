"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Ban, X, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { toast } from "@/hooks/use-toast";

// Dynamically import the QR scanner to avoid SSR issues
const QrReader = dynamic(() => import("react-qr-reader-es6"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-muted flex items-center justify-center">
      Loading scanner...
    </div>
  ),
});

interface QrScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
  scanDelay?: number;
}

export function QrScanner({
  onScan,
  onError,
  scanDelay = 500,
}: QrScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<
    "user" | "environment"
  >("environment");

  // Check camera permissions
  useEffect(() => {
    const checkCameraPermissions = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraFacingMode },
          });
          stream.getTracks().forEach((track) => track.stop());
          setHasPermission(true);
        } else {
          setHasPermission(false);
          throw new Error("Camera not supported in this browser");
        }
      } catch (error) {
        setHasPermission(false);
        onError?.(
          error instanceof Error ? error : new Error("Camera access denied")
        );
      }
    };

    checkCameraPermissions();
  }, [cameraFacingMode, onError]);

  const handleScan = (data: string | null) => {
    if (data) {
      try {
        // Validate scanned data
        if (!isValidData(data)) {
          throw new Error("Invalid QR code format");
        }
        toast({
          variant: "default",
          title: "QR Code Scanned",
        });
        onScan(data);
        setIsScanning(false);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Invalid QR Code",
          description:
            error instanceof Error
              ? error.message
              : "The scanned QR code is not valid",
        });
      }
    }
  };

  const handleError = (err: any) => {
    console.error("QR Scanner Error:", err);
    onError?.(err instanceof Error ? err : new Error("Scanner error occurred"));
    toast({
      variant: "destructive",
      title: "Scanner Error",
      description: "Failed to initialize QR scanner",
    });
  };

  const toggleCamera = () => {
    setCameraFacingMode((prev) =>
      prev === "environment" ? "user" : "environment"
    );
  };

  const isValidData = (data: string): boolean => {
    // Add your validation logic here
    // Example: Check if it's a user ID, payment link, etc.
    return data.length > 0;
  };

  if (hasPermission === false) {
    return (
      <div className="p-6 text-center space-y-4">
        <Ban className="mx-auto h-12 w-12 text-destructive" />
        <p className="text-destructive">
          Camera access denied or not available
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RotateCw className="mr-2 h-4 w-4" />
          Reload and Try Again
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={isScanning} onOpenChange={setIsScanning}>
      <Button onClick={() => setIsScanning(true)}>
        <Camera className="mr-2 h-4 w-4" />
        Escanear código QR
      </Button>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Escanear código QR</DialogTitle>
        </DialogHeader>

        <div className="relative aspect-square">
          {isScanning && hasPermission && (
            <QrReader
              delay={scanDelay}
              onError={handleError}
              onScan={handleScan}
              style={{ width: "100%" }}
              facingMode={cameraFacingMode}
              showViewFinder={false}
            />
          )}

          {/* Scanner overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-16 h-16 border-l-4 border-t-4 border-primary"></div>
            <div className="absolute top-0 right-0 w-16 h-16 border-r-4 border-t-4 border-primary"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 border-l-4 border-b-4 border-primary"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-r-4 border-b-4 border-primary"></div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleCamera} className="flex-1">
            Switch Camera
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsScanning(false)}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Position the QR code within the frame to scan
        </p>
      </DialogContent>
    </Dialog>
  );
}
