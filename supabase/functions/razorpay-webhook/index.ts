import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Razorpay-Signature",
};

async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(body);

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
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("=== Razorpay Webhook Received ===");

    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") || "petmind_webhook_secret";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const signature = req.headers.get("X-Razorpay-Signature");
    if (!signature) {
      console.error("Missing webhook signature");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const rawBody = await req.text();
    console.log("Webhook body received:", rawBody.substring(0, 200));

    const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Webhook signature verified successfully");

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log("Webhook event type:", event);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (event === "payment.captured") {
      const payment = payload.payload.payment.entity;
      const paymentId = payment.id;
      const orderId = payment.order_id;

      console.log(`Payment captured - Payment ID: ${paymentId}, Order ID: ${orderId}`);

      const { data: existingOrder, error: findError } = await supabase
        .from("orders")
        .select("id, status")
        .eq("razorpay_order_id", orderId)
        .maybeSingle();

      if (findError) {
        console.error("Error finding order:", findError);
      }

      if (existingOrder) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "paid",
            razorpay_payment_id: paymentId,
            payment_method: "razorpay",
            payment_id: paymentId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingOrder.id);

        if (updateError) {
          console.error("Error updating order:", updateError);
        } else {
          console.log(`Order ${existingOrder.id} marked as paid`);
        }
      } else {
        console.log("No order found with razorpay_order_id:", orderId);
      }
    } else if (event === "payment.failed") {
      const payment = payload.payload.payment.entity;
      const paymentId = payment.id;
      const orderId = payment.order_id;

      console.log(`Payment failed - Payment ID: ${paymentId}, Order ID: ${orderId}`);

      const { data: existingOrder, error: findError } = await supabase
        .from("orders")
        .select("id, status")
        .eq("razorpay_order_id", orderId)
        .maybeSingle();

      if (findError) {
        console.error("Error finding order:", findError);
      }

      if (existingOrder && existingOrder.status === "pending") {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingOrder.id);

        if (updateError) {
          console.error("Error updating order:", updateError);
        } else {
          console.log(`Order ${existingOrder.id} marked as cancelled`);
        }
      }
    } else if (event === "order.paid") {
      const order = payload.payload.order.entity;
      const orderId = order.id;

      console.log(`Order paid - Order ID: ${orderId}`);

      const { data: existingOrder, error: findError } = await supabase
        .from("orders")
        .select("id, status")
        .eq("razorpay_order_id", orderId)
        .maybeSingle();

      if (findError) {
        console.error("Error finding order:", findError);
      }

      if (existingOrder) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingOrder.id);

        if (updateError) {
          console.error("Error updating order:", updateError);
        } else {
          console.log(`Order ${existingOrder.id} marked as paid`);
        }
      }
    } else {
      console.log(`Unhandled event type: ${event}`);
    }

    return new Response(
      JSON.stringify({ status: "ok", event }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
