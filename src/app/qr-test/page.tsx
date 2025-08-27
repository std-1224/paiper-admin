"use client";

import { useState } from "react";
import { QrScanner } from "../(components)/qr-scanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function QRTestPage() {
  const [lastScannedResult, setLastScannedResult] = useState<string>("");

  const handleScan = (result: string) => {
    setLastScannedResult(result);
    console.log("QR Code scanned:", result);
  };

  const handleError = (error: Error) => {
    console.error("QR Scanner error:", error);
  };

  const testOrderAPI = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      console.log('Orders API test:', data);
    } catch (error) {
      console.error('Orders API error:', error);
    }
  };

  const testGiftsAPI = async () => {
    try {
      const response = await fetch('/api/gifts');
      const data = await response.json();
      console.log('Gifts API test:', data);
    } catch (error) {
      console.error('Gifts API error:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">QR Scanner Test Page</h1>
        <p className="text-muted-foreground">
          Test the QR scanner functionality with both order and gift preview modals
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>QR Scanner Component</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <QrScanner onScan={handleScan} onError={handleError} />
          </div>
          
          {lastScannedResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Last Scanned Result:</h3>
              <Badge variant="outline">{lastScannedResult}</Badge>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <Button onClick={testOrderAPI} variant="outline" size="sm">
              Test Orders API
            </Button>
            <Button onClick={testGiftsAPI} variant="outline" size="sm">
              Test Gifts API
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>✅ Courtesy/Gift QR Scanning Implemented</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">🎁 Gift QR Scanning Features</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Automatically detects if QR code is for an order or gift</li>
              <li>• Shows gift preview with product image, name, and sender info</li>
              <li>• Displays gift value and courtesy message</li>
              <li>• Auto-redemption countdown (18 seconds)</li>
              <li>• Marks gift as "redeemed" when confirmed</li>
              <li>• <strong>Creates single order entry for tracking (no duplicates)</strong></li>
              <li>• Shows "Este QR fue utilizado" for already redeemed gifts</li>
              <li>• Prevents reuse of redeemed gift QR codes</li>
              <li>• <strong>✅ Fixed: No more duplicate orders created</strong></li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">How QR Detection Works:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Scanner first tries to fetch the QR code as an order</li>
              <li>If no order found, it tries to fetch as a gift</li>
              <li>Displays appropriate preview modal based on type detected</li>
              <li>Uses different API endpoints: <code>/api/orders?id=X</code> and <code>/api/gifts?id=X</code></li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">🔄 Gift Lifecycle & Order Creation</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Pending:</strong> Gift is available for redemption</p>
              <p><strong>Redeemed:</strong> Gift has been claimed and delivered</p>
              <p><strong>Order Created:</strong> Automatically creates order entry for tracking</p>
              <p><strong>Expired:</strong> Gift is no longer valid</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Testing Both Order & Gift QR Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">📦 Regular Orders</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Shows order items with quantities</li>
                <li>• Displays table and client information</li>
                <li>• Shows total amount</li>
                <li>• Auto-delivery countdown</li>
                <li>• Marks as "delivered" when confirmed</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🎁 Courtesy Gifts</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Shows gift product with image</li>
                <li>• Displays sender information</li>
                <li>• Shows gift value</li>
                <li>• Auto-redemption countdown</li>
                <li>• Marks as "redeemed" when confirmed</li>
                <li>• <strong>Creates order entry in orders list</strong></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Endpoints Enhanced</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="bg-gray-50 p-3 rounded font-mono text-sm">
            <p><strong>Orders:</strong> GET /api/orders?id=ORDER_ID</p>
            <p><strong>Gifts:</strong> GET /api/gifts?id=GIFT_ID</p>
            <p><strong>Mark Delivered:</strong> PUT /api/orders (status: "delivered")</p>
            <p><strong>Mark Redeemed:</strong> PUT /api/gifts (status: "redeemed")</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
