import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderDetails: {
    user_id: string;
    total_amount: number;
    items: Array<{
      product_id: string;
      quantity: number;
      price: number;
    }>;
    shipping_address?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    coupon_code?: string | null;
    discount_amount?: number;
  };
}

async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const message = `${orderId}|${paymentId}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureData = await crypto.subtle.sign("HMAC", key, messageData);
  const expectedSignature = Array.from(new Uint8Array(signatureData))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedSignature === signature;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("=== Razorpay Verify Payment Function Started ===");

    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!razorpayKeySecret || !supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables!");
      throw new Error("Required environment variables not configured");
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderDetails,
    }: VerifyPaymentRequest = await req.json();

    console.log("=== Payment Verification Request ===");
    console.log("Order ID:", razorpay_order_id);
    console.log("Payment ID:", razorpay_payment_id);
    console.log("Signature received:", razorpay_signature);
    console.log("User ID from order:", orderDetails.user_id);

    console.log("Verifying signature...");
    const isValid = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayKeySecret
    );

    console.log("Signature verification result:", isValid);

    if (!isValid) {
      console.error("SIGNATURE VERIFICATION FAILED!");
      console.error("Expected format: order_id|payment_id");
      console.error("Actual message:", `${razorpay_order_id}|${razorpay_payment_id}`);
      return new Response(
        JSON.stringify({
          error: "Invalid payment signature",
          verified: false,
          details: "The payment signature does not match. This could indicate tampering."
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Signature verified successfully!");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: products } = await supabase
      .from("products")
      .select("name")
      .in("id", orderDetails.items.map(item => item.product_id));

    const productName = products && products.length > 0
      ? products.map(p => p.name).join(", ")
      : "Product";

    const uniqueOrderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_id: uniqueOrderId,
        user_id: orderDetails.user_id,
        total_amount: orderDetails.total_amount,
        status: "pending",
        shipping_address: orderDetails.shipping_address || "",
        customer_name: orderDetails.customer_name,
        customer_email: orderDetails.customer_email,
        customer_phone: orderDetails.customer_phone,
        product_name: productName,
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        payment_method: "razorpay",
        payment_id: razorpay_payment_id,
        coupon_code: orderDetails.coupon_code || null,
        discount_amount: orderDetails.discount_amount || 0,
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    const orderItems = orderDetails.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    console.log("Order created successfully, sending confirmation email...");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (resendApiKey) {
      try {
        const productNames = productName;

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-label { font-weight: bold; color: #6b7280; }
    .detail-value { color: #1f2937; }
    .amount { font-size: 24px; font-weight: bold; color: #10b981; }
    .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐾 Order Confirmed!</h1>
      <p>Thank you for your purchase, ${orderDetails.customer_name}!</p>
    </div>
    <div class="content">
      <p>Your order has been successfully placed and payment confirmed.</p>

      <div class="order-details">
        <div class="detail-row">
          <span class="detail-label">Order ID:</span>
          <span class="detail-value">#${order.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Product(s):</span>
          <span class="detail-value">${productNames}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment ID:</span>
          <span class="detail-value">${razorpay_payment_id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Paid:</span>
          <span class="detail-value amount">₹${orderDetails.total_amount}</span>
        </div>
      </div>

      <p>Your order will be processed and shipped to:</p>
      <p style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
        ${orderDetails.shipping_address || "Address provided at checkout"}
      </p>

      <p>If you have any questions, please contact us at support@petmind.com</p>
    </div>
    <div class="footer">
      <p>Thank you for choosing PetMind AI - Complete Pet Care</p>
    </div>
  </div>
</body>
</html>
        `;

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "PetMind <orders@petmindapp.in>",
            to: [orderDetails.customer_email],
            subject: "Order Confirmed - PetMind",
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          console.log("Order confirmation email sent successfully");
        } else {
          const errorText = await emailResponse.text();
          console.error("Failed to send email:", errorText);
        }
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }
    } else {
      console.warn("RESEND_API_KEY not configured, skipping email");
    }

    return new Response(
      JSON.stringify({
        verified: true,
        order_id: order.id,
        message: "Payment verified and order created successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Unknown error occurred",
        verified: false,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
