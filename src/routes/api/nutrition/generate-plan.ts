import { createFileRoute } from "@tanstack/react-router";

const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY;

export const Route = createFileRoute("/api/nutrition/generate-plan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const patientData = (await request.json()) as {
            conditions: string[];
            age: number;
            gender: string;
            bloodSugar?: number;
            bloodPressure?: string;
            weight?: number;
            activityLevel?: string;
          };

          console.log("🔍 Diet Plan Request:", patientData.conditions);

          if (!patientData.conditions || !patientData.age) {
            return new Response(
              JSON.stringify({ error: "Conditions and age are required" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          if (!GROQ_API_KEY) {
            console.error("❌ GROQ API key not configured");
            return new Response(
              JSON.stringify({ error: "Diet plan API not configured" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const conditionsText = patientData.conditions.join(", ") || "General wellness";
          console.log("📋 Generating diet plan for:", conditionsText);

          const prompt = `You are a nutritionist. Generate a 7-day diet plan for: ${conditionsText}, Age ${patientData.age}.

Return ONLY this JSON, no other text:
{
  "basis": "Diet plan reason",
  "dailyGoals": {"calories": 2000, "carbs": 225, "protein": 50, "fat": 65},
  "days": [
    {
      "day": "Monday",
      "breakfast": {"items": ["item1", "item2"], "calories": 350, "carbs": "45g", "protein": "10g", "fat": "8g", "reason": "reason"},
      "lunch": {"items": ["item1"], "calories": 550, "carbs": "75g", "protein": "15g", "fat": "8g", "reason": "reason"},
      "dinner": {"items": ["item1"], "calories": 450, "carbs": "45g", "protein": "30g", "fat": "12g", "reason": "reason"},
      "snack": {"items": ["item1"], "calories": 200, "carbs": "25g", "protein": "5g", "fat": "8g", "reason": "reason"}
    }
  ],
  "foodsToInclude": ["item1"],
  "foodsToAvoid": ["item1"],
  "exercise": {"activity": "walk", "frequency": "daily", "timing": "morning", "benefits": "health"},
  "hydration": "8 glasses water"
}`;


          console.log("🚀 Calling Groq API...");

          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [{ role: "user", content: prompt }],
              max_tokens: 2000,
              temperature: 0.7,
            }),
          });

          console.log("📊 Groq response status:", response.status);

          if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Groq API error:", errorData);
            return new Response(
              JSON.stringify({
                error: errorData.error?.message || "Failed to call Groq API",
              }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const data = await response.json();
          const responseText = data.choices?.[0]?.message?.content || "";

          console.log("✅ Groq API response received, length:", responseText.length);

          if (!responseText) {
            return new Response(
              JSON.stringify({ error: "No response from AI" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          // Log raw response for debugging
          console.log("📋 Raw response (first 200 chars):", responseText.substring(0, 200));

          // Clean JSON response - more aggressive cleaning
          let cleanedText = responseText
            .replace(/^```json\n?/, "")
            .replace(/\n?```$/, "")
            .replace(/^```\n?/, "")
            .replace(/```$/g, "")
            .trim();

          console.log("🔄 Cleaned text length:", cleanedText.length);
          console.log("🔄 Cleaned text (first 200 chars):", cleanedText.substring(0, 200));

          try {
            const dietPlan = JSON.parse(cleanedText);
            console.log("✅ Diet plan parsed successfully");
            
            return new Response(
              JSON.stringify({
                success: true,
                plan: dietPlan,
                generatedAt: new Date().toISOString(),
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          } catch (parseError) {
            console.error("❌ JSON Parse Error:", parseError);
            console.error("Attempted to parse:", cleanedText.substring(0, 500));
            
            // Try to extract JSON from response if it contains extra text
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              console.log("🔄 Found JSON object, retrying parse...");
              try {
                const dietPlan = JSON.parse(jsonMatch[0]);
                console.log("✅ Diet plan parsed successfully from extracted JSON");
                
                return new Response(
                  JSON.stringify({
                    success: true,
                    plan: dietPlan,
                    generatedAt: new Date().toISOString(),
                  }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                );
              } catch (retryError) {
                console.error("❌ Still failed to parse extracted JSON:", retryError);
              }
            }

            // If all parsing fails, return mock data with the conditions info
            console.log("⚠️ Falling back to mock diet plan...");
            const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            const mockDays = daysOfWeek.map((day) => ({
              day,
              breakfast: { items: ["Oatmeal", "Banana"], calories: 350, carbs: "45g", protein: "10g", fat: "8g", reason: "High fiber, sustains energy" },
              lunch: { items: ["Brown rice", "Chicken", "Vegetables"], calories: 550, carbs: "75g", protein: "25g", fat: "8g", reason: "Balanced meal" },
              dinner: { items: ["Lentil soup", "Whole wheat bread"], calories: 450, carbs: "55g", protein: "20g", fat: "10g", reason: "Light dinner" },
              snack: { items: ["Apple", "Almonds"], calories: 200, carbs: "25g", protein: "5g", fat: "8g", reason: "Healthy snack" }
            }));

            const mockPlan = {
              basis: `Personalized diet plan for ${conditionsText}`,
              dailyGoals: { calories: 2000, carbs: 225, protein: 50, fat: 65 },
              days: mockDays,
              foodsToInclude: ["Whole grains", "Lean proteins", "Leafy greens", "Fruits"],
              foodsToAvoid: ["Deep fried foods", "Processed sugar", "Excess salt"],
              exercise: { activity: "Brisk walk", frequency: "Daily", timing: "Morning", benefits: "Improves circulation and heart health" },
              hydration: "8-10 glasses of water daily"
            };

            return new Response(
              JSON.stringify({
                success: true,
                plan: mockPlan,
                generatedAt: new Date().toISOString(),
                note: "Using template plan - AI response could not be parsed"
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }
        } catch (error) {
          console.error("❌ Diet plan generation error:", error);
          if (error instanceof SyntaxError) {
            return new Response(
              JSON.stringify({
                error: "Invalid response format. Please try again.",
              }),
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
            JSON.stringify({ error: "Failed to generate diet plan" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
