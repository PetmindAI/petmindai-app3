import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  message: string;
  userId: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
}

interface Vet {
  id: string;
  vet_name: string;
  clinic_name: string;
  specialization: string;
  city: string;
  rating: number;
  consultation_fee: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, userId }: ChatRequest = await req.json();

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: "Message and userId are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured. Please add your OPENAI_API_KEY to get AI-powered responses.",
          response: "I'm currently unable to provide AI responses. Please configure the OpenAI API key to enable the AI assistant.",
          recommendedProducts: []
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch products for context
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .limit(20);

    // Fetch vets for context
    const { data: vets } = await supabase
      .from("vets")
      .select("*")
      .eq("is_approved", true)
      .order("rating", { ascending: false })
      .limit(10);

    // Create product context for AI
    const productContext = products
      ? products.map((p: Product) =>
          `${p.name} (${p.category}) - ₹${p.price} - ${p.description}`
        ).join("\n")
      : "";

    // Create vet context for AI
    const vetContext = vets
      ? vets.map((v: Vet) =>
          `${v.vet_name} at ${v.clinic_name} - ${v.specialization} - ${v.city} - Rating: ${v.rating} - Fee: ₹${v.consultation_fee}`
        ).join("\n")
      : "";

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful pet care assistant for PetMind, an Indian pet care platform.

Provide helpful advice about pet care, training, health, and nutrition. When relevant, recommend products from our marketplace.

When users ask about health problems, symptoms, or medical concerns, recommend nearby veterinarians from our verified vet network.

Available Products:
${productContext}

Available Veterinarians:
${vetContext}

When recommending products or vets, respond with JSON in this format:
{
  "advice": "Your helpful advice here",
  "products": ["product_id_1", "product_id_2"],
  "vets": ["vet_id_1", "vet_id_2"]
}

IMPORTANT: When a user mentions health issues, symptoms, allergies, or medical problems:
1. Provide basic advice
2. ALWAYS recommend consulting a veterinarian
3. Include 2-3 top-rated veterinarians from the list (prioritize by rating)

If no products or vets are relevant, use empty arrays. Always be friendly, informative, and focused on pet welfare.`
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const aiData = await openaiResponse.json();
    const aiMessage = aiData.choices[0].message.content;

    // Try to parse JSON response, fallback to text
    let advice = aiMessage;
    let recommendedProductIds: string[] = [];
    let recommendedVetIds: string[] = [];

    try {
      const parsed = JSON.parse(aiMessage);
      advice = parsed.advice || aiMessage;
      recommendedProductIds = parsed.products || [];
      recommendedVetIds = parsed.vets || [];
    } catch {
      // If not JSON, use as plain text
      advice = aiMessage;
    }

    // Fetch recommended products
    let recommendedProducts: Product[] = [];
    if (recommendedProductIds.length > 0 && products) {
      recommendedProducts = products.filter((p: Product) =>
        recommendedProductIds.includes(p.id)
      );
    }

    // Fetch recommended vets
    let recommendedVets: Vet[] = [];
    if (recommendedVetIds.length > 0 && vets) {
      recommendedVets = vets.filter((v: Vet) =>
        recommendedVetIds.includes(v.id)
      );
    }

    // Save to chat history
    await supabase.from("chat_history").insert({
      user_id: userId,
      message: message,
      response: advice,
      recommended_products: recommendedProducts.length > 0
        ? recommendedProducts
        : null,
    });

    return new Response(
      JSON.stringify({
        response: advice,
        recommendedProducts: recommendedProducts,
        recommendedVets: recommendedVets,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
        response: "I apologize, but I encountered an error. Please try again.",
        recommendedProducts: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
