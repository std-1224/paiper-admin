"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  DollarSign,
  User,
  ShoppingBag,
  Check,
  ArrowLeft,
  Wallet,
  CreditCardIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createSupaClient } from "@/lib/supabaseClient";
import { CartItem, User as UserType } from "@/types/types";

type PaymentMethod = "mercadopago" | "cash" | "balance";

interface CheckoutProps {
  cartItems: CartItem[];
  selectedUser: UserType | null;
  onOrderComplete: () => void;
  isFromTable: boolean;
  tableNumber: string;
}

export default function Checkout({
  cartItems,
  selectedUser,
  onOrderComplete,
  isFromTable,
  tableNumber,
}: CheckoutProps) {
  const supabase = createSupaClient();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("mercadopago");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate order totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.sale_price * item.quantity,
    0
  );
  const serviceCharge = subtotal * 0.1; // 10% service charge
  const total = subtotal + serviceCharge;

  const handlePaymentSubmit = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser?.id || null,
          user_name: selectedUser?.name || null,
          status: "pending",
          total_amount: total,
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_table_order: isFromTable,
          table_number: tableNumber || null,
          payment_method: paymentMethod,
          // order items
          order_items: cartItems.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.purchase_price,
            notes: null, // Add notes if needed
            created_at: new Date().toISOString(),
          })),
        }),
      });

      // Show success state
      setIsProcessing(false);
      setIsComplete(true);

      // Notify parent component that order is complete
      onOrderComplete();
    } catch (err) {
      console.error("Error creating order:", err);
      setError("Error al procesar el pedido. Por favor, inténtalo de nuevo.");
      setIsProcessing(false);
    }
  };

  return (
    <div className=" ">
      <div className="m-6 ">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-muted-foreground">Complete your order</p>
      </div>

      {isComplete ? (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto my-4 bg-primary/10 h-20 w-20 rounded-full flex items-center justify-center">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Order Complete!</CardTitle>
            <CardDescription>
              Your order has been successfully placed.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push("/")}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-5">
          {/* Left column - Order summary */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-muted">
                          <img
                            src={item.image_url || "/placeholder.svg"}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${item.sale_price.toFixed(2)} x {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          ${(item.sale_price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Charge (10%)</span>
                    <span>${serviceCharge.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User information */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedUser ? (
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={selectedUser.avatar}
                        alt={selectedUser.name}
                      />
                      <AvatarFallback>
                        {selectedUser?.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedUser.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Anonymous Customer
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column - Payment method */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
                <CardDescription>Select how you want to pay</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) =>
                    setPaymentMethod(value as PaymentMethod)
                  }
                  className="space-y-4"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mercadopago" id="mercadopago" />
                      <Label
                        htmlFor="mercadopago"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className="bg-blue-500 text-white p-1 rounded">
                          <CreditCardIcon className="h-4 w-4" />
                        </div>
                        Mercado Pago
                      </Label>
                    </div>
                    {paymentMethod === "mercadopago" && (
                      <div className="mt-3 ml-6 text-sm text-muted-foreground">
                        Pay securely with Mercado Pago
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label
                        htmlFor="cash"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className="bg-green-500 text-white p-1 rounded">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        Cash
                      </Label>
                    </div>
                    {paymentMethod === "cash" && (
                      <div className="mt-3 ml-6 text-sm text-muted-foreground">
                        Pay with cash at the counter
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="balance" id="balance" />
                      <Label
                        htmlFor="balance"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className="bg-purple-500 text-white p-1 rounded">
                          <Wallet className="h-4 w-4" />
                        </div>
                        Cashless
                      </Label>
                    </div>
                    {paymentMethod === "balance" && (
                      <div className="mt-3 ml-6 text-sm text-muted-foreground">
                        Pay with your cashless wristband
                      </div>
                    )}
                  </div>
                </RadioGroup>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                {error && (
                  <div className="w-full p-2 text-sm text-red-500 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePaymentSubmit}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Complete Order"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
