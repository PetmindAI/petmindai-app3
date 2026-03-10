import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrderEmailPayload {
  order_id: string;
  customer_email: string;
  customer_name: string;
  status: string;
  product_names: string[];
  total_amount: number;
}

const getEmailTemplate = (data: OrderEmailPayload) => {
  const { customer_name, order_id, status, product_names, total_amount } = data;
  const orderIdShort = order_id.slice(0, 8).toUpperCase();

  let subject = "";
  let message = "";
  let statusBadge = "";
  let deliveryMessage = "";

  switch (status) {
    case "processing":
      subject = `Order ${orderIdShort} is Being Processed`;
      statusBadge = "🔄 Processing";
      message = `Great news! Your order is now being processed. We're preparing your items for shipment.`;
      deliveryMessage = "Your order will be shipped within 1-2 business days.";
      break;
    case "shipped":
      subject = `Order ${orderIdShort} Has Been Shipped`;
      statusBadge = "🚚 Shipped";
      message = `Exciting news! Your order is on its way to you.`;
      deliveryMessage = "Expected delivery: 3-5 business days from shipment date.";
      break;
    case "delivered":
      subject = `Order ${orderIdShort} Has Been Delivered`;
      statusBadge = "✅ Delivered";
      message = `Your order has been successfully delivered! We hope you and your pets enjoy your purchase.`;
      deliveryMessage = "Thank you for shopping with PawPal!";
      break;
    default:
      subject = `Order ${orderIdShort} Status Update`;
      statusBadge = `📦 ${status.charAt(0).toUpperCase() + status.slice(1)}`;
      message = `Your order status has been updated.`;
      deliveryMessage = "";
  }

  const productList = product_names.map(name => `<li style="margin: 8px 0;">${name}</li>`).join("");

  return {
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🐾 PawPal</h1>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding: 30px 30px 20px; text-align: center;">
              <div style="display: inline-block; background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 12px 24px;">
                <span style="font-size: 18px; font-weight: 600; color: #059669;">${statusBadge}</span>
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151; line-height: 1.6;">
                Hi <strong>${customer_name}</strong>,
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151; line-height: 1.6;">
                ${message}
              </p>

              <!-- Order Details Box -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="margin: 0 0 16px; font-size: 18px; color: #1f2937;">Order Details</h2>
                <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                  <strong>Order ID:</strong> ${orderIdShort}
                </p>
                <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
                  <strong>Total Amount:</strong> ₹${total_amount}
                </p>

                <h3 style="margin: 16px 0 8px; font-size: 16px; color: #1f2937;">Products:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.6;">
                  ${productList}
                </ul>
              </div>

              ${deliveryMessage ? `
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #1e40af;">
                  <strong>📅 ${deliveryMessage}</strong>
                </p>
              </div>
              ` : ''}

              <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                If you have any questions about your order, please don't hesitate to contact us.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                Thank you for choosing PawPal!
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const payload: OrderEmailPayload = await req.json();

    const { customer_email, status } = payload;

    if (!customer_email) {
      throw new Error("Customer email is required");
    }

    if (!["processing", "shipped", "delivered"].includes(status)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Email not sent for status: ${status}. Only processing, shipped, and delivered trigger emails.`
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const emailTemplate = getEmailTemplate(payload);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "PawPal <onboarding@resend.dev>",
        to: [customer_email],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const resendData = await resendResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        email_id: resendData.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
