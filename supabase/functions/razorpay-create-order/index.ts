import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateOrderRequest {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: {
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("=== Razorpay Create Order Function Called ===");
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    console.log("Razorpay Key ID exists:", !!razorpayKeyId);
    console.log("Razorpay Key ID (first 10 chars):", razorpayKeyId?.substring(0, 10));
    console.log("Razorpay Key Secret exists:", !!razorpayKeySecret);

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("CRITICAL: Razorpay credentials not configured");
      return new Response(
        JSON.stringify({
          error: "Razorpay credentials not configured",
          details: "RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables are missing"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body received:", requestBody);
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          details: parseError.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { amount, currency = "INR", receipt, notes }: CreateOrderRequest = requestBody;

    console.log("Parsed values - Amount:", amount, "Currency:", currency);

    if (!amount || amount <= 0) {
      console.error("Invalid amount received:", amount);
      return new Response(
        JSON.stringify({
          error: "Invalid amount",
          details: `Amount must be greater than 0, received: ${amount}`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const amountInPaise = Math.round(amount * 100);
    const orderData = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    };

    console.log("Creating Razorpay order with data:", {
      amount: amountInPaise,
      amountInRupees: amount,
      currency,
      receipt: orderData.receipt
    });

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    console.log("Authorization header created (length):", auth.length);

    console.log("Calling Razorpay API...");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    console.log("Razorpay API response status:", response.status);
    console.log("Razorpay API response ok:", response.ok);

    const responseText = await response.text();
    console.log("Razorpay API raw response:", responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Razorpay response:", parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid response from Razorpay API",
          details: responseText,
          status: response.status
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!response.ok) {
      console.error("Razorpay API error response:", responseData);
      const errorMessage = responseData.error?.description ||
                          responseData.error?.message ||
                          "Failed to create Razorpay order";

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: responseData,
          status: response.status
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Razorpay order created successfully!");
    console.log("Order ID:", responseData.id);
    console.log("Order amount:", responseData.amount);
    console.log("Order currency:", responseData.currency);
    console.log("IMPORTANT: Order was created with key ID:", razorpayKeyId?.substring(0, 10));

    return new Response(
      JSON.stringify({
        id: responseData.id,
        amount: responseData.amount,
        currency: responseData.currency,
        receipt: responseData.receipt,
        status: responseData.status,
        key_id: razorpayKeyId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("=== CRITICAL ERROR in razorpay-create-order ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    return new Response(
      JSON.stringify({
        error: error.message || "Unknown error occurred",
        type: error.constructor.name,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
