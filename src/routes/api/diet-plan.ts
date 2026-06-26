import { json } from "@tanstack/start";
import { Groq } from "groq-sdk";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.VITE_GROQ_API_KEY,
});

// Helper function to format error response
function errorResponse(message: string, status = 400) {
  return json({ error: message }, { status });
}

// Generate disease-specific diet plan
export async function generateDietPlan(patientData: {
  conditions: string[];
  age: number;
  gender: string;
  bloodSugar?: number;
  bloodPressure?: string;
  weight?: number;
  activityLevel?: string;
}) {
  try {
    if (!process.env.VITE_GROQ_API_KEY) {
      return errorResponse("Groq API key not configured", 500);
    }

    const conditionsText = patientData.conditions.join(", ") || "General wellness";
    const bpInfo = patientData.bloodPressure ? `Blood Pressure: ${patientData.bloodPressure} mmHg` : "";
    const sugarInfo = patientData.bloodSugar ? `Blood Sugar: ${patientData.bloodSugar} mg/dL` : "";

    const prompt = `You are a nutritionist AI for chronic disease management. Generate a personalized 7-day diet plan for a patient.

Patient Profile:
- Conditions: ${conditionsText}
- Age: ${patientData.age}
- Gender: ${patientData.gender}
- Activity Level: ${patientData.activityLevel || "Moderate"}
- ${bpInfo}
- ${sugarInfo}

Generate a JSON response with this exact structure:
{
  "basis": "Description of why this plan was created",
  "meals": [
    {
      "day": "Monday",
      "breakfast": {
        "name": "Food item with quantity",
        "calories": 350,
        "carbs": "45g",
        "protein": "10g",
        "fat": "8g",
        "reason": "Why this is good for the patient's condition"
      },
      "lunch": {...},
      "dinner": {...},
      "snack": {...},
      "dailyTotal": 2000
    }
  ],
  "tips": [
    "Specific lifestyle tips for this patient"
  ],
  "restrictions": [
    "Foods to avoid based on conditions"
  ],
  "hydration": "Water intake recommendation",
  "exercise": "Recommended physical activity"
}

Focus on:
- Diabetes: Low glycemic index, controlled carbs
- Hypertension: Low sodium, high potassium
- CKD: Low sodium, controlled protein
- COPD: Calorie-rich foods for energy
- Cardiovascular Disease: Low fat, high fiber
- General: Balanced nutrition for chronic care

Respond ONLY with valid JSON, no markdown or extra text.`;

    const message = await groq.messages.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Clean the response - remove markdown code blocks if present
    let cleanedText = responseText
      .replace(/^```json\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    const dietPlan = JSON.parse(cleanedText);

    return json({
      success: true,
      plan: dietPlan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Diet plan generation error:", error);
    if (error instanceof SyntaxError) {
      return errorResponse(
        "Failed to parse diet plan. Please try again.",
        500
      );
    }
    return errorResponse("Failed to generate diet plan", 500);
  }
}

// Calculate food nutrition information
export async function calculateFoodNutrition(foodName: string) {
  try {
    if (!process.env.VITE_GROQ_API_KEY) {
      return errorResponse("Groq API key not configured", 500);
    }

    const prompt = `You are a nutrition database. For the food item: "${foodName}", provide nutritional information for a typical serving.

Return ONLY a JSON object with this structure:
{
  "name": "Food name with quantity",
  "calories": 250,
  "carbs": "35g",
  "protein": "8g",
  "fat": "6g",
  "fiber": "3g",
  "sugar": "12g",
  "servingSize": "Standard serving size",
  "vitamins": ["Key vitamins present"],
  "minerals": ["Key minerals present"],
  "healthBenefits": "Brief health benefits",
  "warnings": "Any dietary warnings or allergies"
}

If the food is unclear or multiple items, ask for clarification. Make estimates based on typical serving sizes.
Respond ONLY with valid JSON, no markdown or extra text.`;

    const message = await groq.messages.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Clean the response
    let cleanedText = responseText
      .replace(/^```json\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    const nutrition = JSON.parse(cleanedText);

    return json({
      success: true,
      nutrition,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Food nutrition calculation error:", error);
    return errorResponse("Failed to calculate food nutrition", 500);
  }
}

// Export for use in route handlers
export { json };
