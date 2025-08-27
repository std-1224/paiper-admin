"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Ban, X, RotateCw, Clock, User, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  products: {
    name: string;
    image_url?: string;
  };
}

interface ScannedOrder {
  id: string;
  table_number?: string;
  user_name?: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
  user?: {
    email: string;
    name?: string;
  };
}

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

  // Order preview modal states
  const [showOrderPreview, setShowOrderPreview] = useState(false);
  const [scannedOrder, setScannedOrder] = useState<ScannedOrder | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [autoDeliveryCountdown, setAutoDeliveryCountdown] = useState(18);
  const [isAlreadyUsed, setIsAlreadyUsed] = useState(false);

  // Auto-delivery countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (showOrderPreview && !isAlreadyUsed && autoDeliveryCountdown > 0) {
      interval = setInterval(() => {
        setAutoDeliveryCountdown((prev) => {
          if (prev <= 1) {
            // Auto mark as delivered
            handleMarkAsDelivered();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showOrderPreview, isAlreadyUsed, autoDeliveryCountdown]);

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

  // Fetch order details by ID
  const fetchOrderDetails = async (orderId: string): Promise<ScannedOrder | null> => {
    try {
      const response = await fetch(`/api/orders?id=${orderId}`);
      if (!response.ok) {
        throw new Error('Order not found');
      }
      const order = await response.json();
      return order || null;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  };

  const handleScan = async (data: string | null) => {
    if (data) {
      try {
        // Validate scanned data
        if (!isValidData(data)) {
          throw new Error("Invalid QR code format");
        }

        console.log("data: ", data)

        setIsScanning(false);
        setIsLoadingOrder(true);

        // Fetch order details
        const order = await fetchOrderDetails(data);

        if (!order) {
          toast({
            variant: "destructive",
            title: "Order Not Found",
            description: "No order found with this QR code",
          });
          setIsLoadingOrder(false);
          return;
        }

        // Check if order is already delivered
        if (order.status === "delivered") {
          setIsAlreadyUsed(true);
          setScannedOrder(order);
          setShowOrderPreview(true);
          setIsLoadingOrder(false);
          return;
        }

        setScannedOrder(order);
        setShowOrderPreview(true);
        setIsLoadingOrder(false);
        setAutoDeliveryCountdown(18);

        toast({
          variant: "default",
          title: "QR Code Scanned",
          description: "Order preview loaded successfully",
        });

        onScan(data);
      } catch (error) {
        setIsLoadingOrder(false);
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

  // Mark order as delivered
  const handleMarkAsDelivered = async () => {
    if (!scannedOrder) return;

    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: scannedOrder.id,
          status: 'delivered',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark order as delivered');
      }

      toast({
        variant: "default",
        title: "Order Delivered",
        description: "Order has been marked as delivered successfully",
      });

      setShowOrderPreview(false);
      setScannedOrder(null);
      setAutoDeliveryCountdown(18);
      setIsAlreadyUsed(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark order as delivered",
      });
    }
  };

  // Cancel order preview
  const handleCancelPreview = () => {
    setShowOrderPreview(false);
    setScannedOrder(null);
    setAutoDeliveryCountdown(18);
    setIsAlreadyUsed(false);
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
    <>
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

      {/* Order Preview Modal */}
    <Dialog open={showOrderPreview} onOpenChange={setShowOrderPreview}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Order Preview</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancelPreview}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoadingOrder ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : scannedOrder ? (
          <div className="space-y-4">
            {/* Already Used Warning */}
            {isAlreadyUsed ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">
                    Este QR fue utilizado
                  </span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  This order has already been marked as delivered.
                </p>
              </div>
            ) : (
              /* Auto-delivery countdown */
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">
                    Auto-delivery in {autoDeliveryCountdown} seconds
                  </span>
                </div>
                <Progress
                  value={((18 - autoDeliveryCountdown) / 18) * 100}
                  className="h-2 mb-2"
                />
                <p className="text-sm text-orange-700">
                  This order will be automatically marked as delivered in {autoDeliveryCountdown} seconds.
                </p>
              </div>
            )}

            {/* Order Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Table</p>
                  <p className="font-medium">Table {scannedOrder.table_number || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{scannedOrder.user_name || scannedOrder.user?.name || scannedOrder.user?.email || 'Guest'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <h4 className="font-medium mb-3">Order Items</h4>
              <div className="space-y-3">
                {scannedOrder.order_items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.products.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">${(item.unit_price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Total Amount */}
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount</span>
              <span>${scannedOrder.total_amount?.toFixed(2) || '0.00'}</span>
            </div>

            {/* Action Buttons */}
            {!isAlreadyUsed && (
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancelPreview}
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleMarkAsDelivered}
                  className="flex-1"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Delivered
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
    </>
  );
}
