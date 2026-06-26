import { createFileRoute } from "@tanstack/react-router";

const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY;

export const Route = createFileRoute("/api/nutrition/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { foodName } = (await request.json()) as { foodName: string };

          console.log("🔍 Food Search Request:", foodName);

          if (!foodName || typeof foodName !== "string") {
            return new Response(
              JSON.stringify({ error: "Food name is required" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          if (!GROQ_API_KEY) {
            console.error("❌ GROQ API key not configured");
            return new Response(
              JSON.stringify({ error: "Nutrition API not configured" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          console.log("🚀 Calling Groq API for food:", foodName);

          const prompt = `You are a nutrition database. For "${foodName}", provide nutrition info as JSON only:
{
  "name": "food name with quantity",
  "calories": 100,
  "carbs": "15g",
  "protein": "5g",
  "fat": "3g",
  "fiber": "2g",
  "sugar": "5g",
  "servingSize": "serving description",
  "healthBenefits": "benefits",
  "warnings": "any warnings"
}
Return ONLY valid JSON.`;

          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [{ role: "user", content: prompt }],
              max_tokens: 300,
              temperature: 0.7,
            }),
          });

          console.log("📊 Groq response status:", response.status);

          if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Groq API error:", errorData);
            return new Response(
              JSON.stringify({ error: "Failed to fetch nutrition data" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const data = await response.json();
          console.log("✅ Groq API response received");
          const responseText = data.choices?.[0]?.message?.content || "";

          if (!responseText) {
            return new Response(
              JSON.stringify({ error: "No nutrition data found" }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }

          // Clean JSON
          let cleanedText = responseText
            .replace(/^```json\n?/, "")
            .replace(/\n?```$/, "")
            .replace(/^```\n?/, "")
            .trim();

          console.log("🔄 Parsing JSON...");
          const nutrition = JSON.parse(cleanedText);
          console.log("✅ Nutrition data parsed successfully");

          return new Response(
            JSON.stringify({
              success: true,
              nutrition,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.error("❌ Nutrition search error:", error);
          if (error instanceof SyntaxError) {
            return new Response(
              JSON.stringify({ error: "Invalid nutrition data format" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
          if (error instanceof Error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
          return new Response(
            JSON.stringify({ error: "Failed to get nutrition information" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
