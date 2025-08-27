"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

// Global flag to prevent duplicate processing across all instances
let globalProcessingFlag = false;

// Dynamically import the QR scanner to avoid SSR issues
const QrReader = dynamic(() => import("react-qr-reader-es6"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-muted flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="mt-2 text-sm text-muted-foreground">Loading scanner...</p>
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

interface ScannedGift {
  id: string;
  status: 'pending' | 'redeemed' | 'expired';
  created_at: string;
  description?: string;
  table_id?: number;
  user_id?: string;
  products: {
    id: string;
    name: string;
    image_url?: string;
    sale_price: number;
  };
  sender: {
    id: string;
    email: string;
    name?: string;
  };
}

type ScannedItem = ScannedOrder | ScannedGift;

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
  const [cameraReady, setCameraReady] = useState(false);

  // Order/Gift preview modal states
  const [showOrderPreview, setShowOrderPreview] = useState(false);
  const [scannedOrder, setScannedOrder] = useState<ScannedOrder | null>(null);
  const [scannedGift, setScannedGift] = useState<ScannedGift | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [autoDeliveryCountdown, setAutoDeliveryCountdown] = useState(18);
  const [isAlreadyUsed, setIsAlreadyUsed] = useState(false);
  const [itemType, setItemType] = useState<'order' | 'gift'>('order');
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const markAsDeliveredRef = useRef<(() => Promise<void>) | null>(null);

  // Auto-delivery countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (showOrderPreview && !isAlreadyUsed && autoDeliveryCountdown > 0 && !isProcessing && !processingRef.current) {
      interval = setInterval(() => {
        setAutoDeliveryCountdown((prev) => {
          // If countdown was disabled (set to -1), stop the interval
          if (prev === -1) {
            return -1;
          }

          if (prev <= 1) {
            // Auto mark as delivered only if not already processing
            if (!processingRef.current && markAsDeliveredRef.current) {
              markAsDeliveredRef.current();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showOrderPreview, isAlreadyUsed, autoDeliveryCountdown, isProcessing]);

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

          // Add a small delay to ensure camera is ready
          setTimeout(() => {
            setCameraReady(true);
          }, 1000);
        } else {
          setHasPermission(false);
          throw new Error("Camera not supported in this browser");
        }
      } catch (error) {
        setHasPermission(false);
        setCameraReady(false);
        onError?.(
          error instanceof Error ? error : new Error("Camera access denied")
        );
      }
    };

    if (isScanning) {
      setCameraReady(false);
      checkCameraPermissions();
    }
  }, [cameraFacingMode, onError, isScanning]);

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

  // Fetch gift details by ID
  const fetchGiftDetails = async (giftId: string): Promise<ScannedGift | null> => {
    try {
      const response = await fetch(`/api/gifts?id=${giftId}`);
      if (!response.ok) {
        throw new Error('Gift not found');
      }
      const gift = await response.json();
      return gift || null;
    } catch (error) {
      console.error('Error fetching gift:', error);
      return null;
    }
  };

  // Determine if QR code is for order or gift and fetch accordingly
  const fetchItemDetails = async (qrData: string): Promise<{item: ScannedOrder | ScannedGift | null, type: 'order' | 'gift'}> => {
    // First try to fetch as an order
    const order = await fetchOrderDetails(qrData);
    if (order) {
      return { item: order, type: 'order' };
    }

    // If not found as order, try as gift
    const gift = await fetchGiftDetails(qrData);
    if (gift) {
      return { item: gift, type: 'gift' };
    }

    return { item: null, type: 'order' };
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

        // Fetch item details (order or gift)
        const { item, type } = await fetchItemDetails(data);

        if (!item) {
          toast({
            variant: "destructive",
            title: "Item Not Found",
            description: "No order or gift found with this QR code",
          });
          setIsLoadingOrder(false);
          return;
        }

        setItemType(type);

        if (type === 'order') {
          const order = item as ScannedOrder;

          // Check if order is already delivered
          if (order.status === "delivered") {
            setIsAlreadyUsed(true);
            setScannedOrder(order);
            setScannedGift(null);
            setShowOrderPreview(true);
            setIsLoadingOrder(false);
            return;
          }

          setScannedOrder(order);
          setScannedGift(null);
          setShowOrderPreview(true);
          setIsLoadingOrder(false);
          setAutoDeliveryCountdown(18);

          toast({
            variant: "default",
            title: "QR Code Scanned",
            description: "Order preview loaded successfully",
          });
        } else {
          const gift = item as ScannedGift;

          // Check if gift is already redeemed
          if (gift.status === "redeemed") {
            setIsAlreadyUsed(true);
            setScannedGift(gift);
            setScannedOrder(null);
            setShowOrderPreview(true);
            setIsLoadingOrder(false);
            return;
          }

          setScannedGift(gift);
          setScannedOrder(null);
          setShowOrderPreview(true);
          setIsLoadingOrder(false);
          setAutoDeliveryCountdown(18);

          toast({
            variant: "default",
            title: "QR Code Scanned",
            description: "Gift preview loaded successfully",
          });
        }

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

  // Mark order as delivered or gift as redeemed
  const handleMarkAsDelivered = async () => {
    if (!scannedOrder && !scannedGift) return;
    if (isProcessing || processingRef.current || globalProcessingFlag) return; // Prevent duplicate processing

    setIsProcessing(true);
    processingRef.current = true;
    globalProcessingFlag = true; // Set global flag
    setAutoDeliveryCountdown(-1); // Set to -1 to completely disable countdown

    try {
      if (itemType === 'order' && scannedOrder) {
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
      } else if (itemType === 'gift' && scannedGift) {
        // First mark the gift as redeemed
        const giftResponse = await fetch('/api/gifts', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: scannedGift.id,
            status: 'redeemed',
          }),
        });

        if (!giftResponse.ok) {
          throw new Error('Failed to mark gift as redeemed');
        }

        // Then create a corresponding order for tracking
        const orderData = {
          user_id: scannedGift.user_id,
          user_name: scannedGift.sender.name || scannedGift.sender.email,
          status: 'delivered',
          total_amount: scannedGift.products.sale_price,
          notes: `Courtesy gift: ${scannedGift.description || 'Gift redeemed'}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_table_order: false,
          table_number: scannedGift.table_id?.toString(),
          payment_method: 'courtesy',
          order_items: [{
            product_id: scannedGift.products.id,
            quantity: 1,
            unit_price: scannedGift.products.sale_price,
          }]
        };

        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        if (!orderResponse.ok) {
          console.warn('Failed to create order for redeemed gift, but gift was marked as redeemed');
        }

        toast({
          variant: "default",
          title: "Gift Redeemed",
          description: "Gift has been redeemed and added to orders list",
        });
      }

      setShowOrderPreview(false);
      setScannedOrder(null);
      setScannedGift(null);
      setAutoDeliveryCountdown(18);
      setIsAlreadyUsed(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: itemType === 'order' ? "Failed to mark order as delivered" : "Failed to mark gift as redeemed",
      });
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
      globalProcessingFlag = false; // Reset global flag
    }
  };

  // Store the function in ref to prevent useEffect recreation
  useEffect(() => {
    markAsDeliveredRef.current = handleMarkAsDelivered;
  });

  // Cancel order/gift preview
  const handleCancelPreview = () => {
    setShowOrderPreview(false);
    setScannedOrder(null);
    setScannedGift(null);
    setAutoDeliveryCountdown(18);
    setIsAlreadyUsed(false);
    setItemType('order');
    setIsProcessing(false);
    processingRef.current = false;
    globalProcessingFlag = false; // Reset global flag
  };

  const handleError = (err: any) => {
    console.error("QR Scanner Error:", err);

    // Handle specific video/camera errors
    if (err?.message?.includes('videoWidth') || err?.message?.includes('video') || err?.name === 'TypeError') {
      toast({
        variant: "destructive",
        title: "Camera Initializing",
        description: "Camera is still loading. Please wait a moment and try again.",
      });
      return;
    }

    onError?.(err instanceof Error ? err : new Error("Scanner error occurred"));
    toast({
      variant: "destructive",
      title: "Scanner Error",
      description: "Failed to initialize QR scanner. Please check camera permissions.",
    });
  };

  const toggleCamera = () => {
    setCameraReady(false);
    setCameraFacingMode((prev) =>
      prev === "environment" ? "user" : "environment"
    );
  };

  const handleCloseScanner = () => {
    setIsScanning(false);
    setCameraReady(false);
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
      <Dialog open={isScanning} onOpenChange={(open) => !open && handleCloseScanner()}>
        <Button onClick={() => setIsScanning(true)}>
          <Camera className="mr-2 h-4 w-4" />
          Escanear código QR
        </Button>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Escanear código QR</DialogTitle>
          </DialogHeader>

          <div className="relative aspect-square">
            {isScanning && hasPermission && cameraReady ? (
              <QrReader
                delay={scanDelay}
                onError={handleError}
                onScan={handleScan}
                style={{ width: "100%" }}
                facingMode={cameraFacingMode}
                showViewFinder={false}
              />
            ) : isScanning && hasPermission ? (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Initializing camera...</p>
                </div>
              </div>
            ) : null}

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
              onClick={handleCloseScanner}
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

      {/* Order/Gift Preview Modal */}
    <Dialog open={showOrderPreview} onOpenChange={setShowOrderPreview}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {itemType === 'order' ? 'Order Preview' : 'Gift Preview'}
            </DialogTitle>
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
        ) : (scannedOrder || scannedGift) ? (
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
                  {itemType === 'order'
                    ? 'This order has already been marked as delivered.'
                    : 'This gift has already been redeemed.'}
                </p>
              </div>
            ) : (
              /* Auto-delivery countdown */
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">
                    Auto-{itemType === 'order' ? 'delivery' : 'redemption'} in {autoDeliveryCountdown} seconds
                  </span>
                </div>
                <Progress
                  value={((18 - autoDeliveryCountdown) / 18) * 100}
                  className="h-2 mb-2"
                />
                <p className="text-sm text-orange-700">
                  This {itemType} will be automatically marked as {itemType === 'order' ? 'delivered' : 'redeemed'} in {autoDeliveryCountdown} seconds.
                </p>
              </div>
            )}

            {/* Details Section */}
            {itemType === 'order' && scannedOrder ? (
              <>
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
              </>
            ) : itemType === 'gift' && scannedGift ? (
              <>
                {/* Gift Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 rounded-md overflow-hidden">
                      <img
                        src={scannedGift.products.image_url || '/placeholder-gift.png'}
                        alt={scannedGift.products.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{scannedGift.products.name}</h3>
                      <p className="text-sm text-muted-foreground">Courtesy Gift</p>
                      <p className="font-medium text-primary">${scannedGift.products.sale_price?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>

                  {scannedGift.description && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-sm italic">"{scannedGift.description}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">From</p>
                        <p className="font-medium">{scannedGift.sender.name || scannedGift.sender.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={scannedGift.status === 'pending' ? 'default' : 'secondary'}>
                          {scannedGift.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Gift Value */}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Gift Value</span>
                  <span>${scannedGift.products.sale_price?.toFixed(2) || '0.00'}</span>
                </div>
              </>
            ) : null}

            {/* Action Buttons */}
            {!isAlreadyUsed && (
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancelPreview}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleMarkAsDelivered}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {itemType === 'order' ? 'Mark as Delivered' : 'Mark as Redeemed'}
                    </>
                  )}
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
