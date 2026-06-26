import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/analyze-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { imageBase64, mimeType, patientName, reportId } = (await request.json()) as {
          imageBase64: string;
          mimeType: string;
          patientName?: string;
          reportId: string;
        };

        if (!imageBase64) return json({ error: "No image provided" }, 400);

        const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
        if (!key) return json({ error: "Missing VITE_GROQ_API_KEY" }, 500);

        // Precise prompt aligned exactly with dashboard parameters
        const systemPrompt = `You are a medical report analyzer for MedSeva, an Indian chronic disease care platform.
You MUST respond with ONLY a raw JSON object. No markdown. No explanation. No code fences. Just the JSON.`;

        const userPrompt = `Analyze this medical report for patient "${patientName ?? "Patient"}".

Extract ONLY these specific parameters that the dashboard displays:
1. blood_sugar_value (number in mg/dL, e.g. 142) — look for Fasting Glucose, Random Glucose, Blood Sugar
2. blood_pressure_systolic (number, e.g. 138) — systolic BP
3. blood_pressure_diastolic (number, e.g. 88) — diastolic BP
4. hba1c (string with %, e.g. "7.2%") — glycated hemoglobin
5. cholesterol (number in mg/dL) — Total Cholesterol
6. risk_level — "HIGH" if any critical value, "MODERATE" if borderline values, "STABLE" if all normal
7. risk_score — number 0-100 (HIGH=70-100, MODERATE=40-69, STABLE=0-39)
8. summary — 2 sentences in simple English for an Indian patient, mention specific values found
9. ai_insight — 1 encouraging sentence about what they should do next
10. lab_values — array of ALL values found in the report

Return this EXACT JSON (use null for any value not found in the report):
{"blood_sugar_value":142,"blood_pressure_systolic":138,"blood_pressure_diastolic":88,"hba1c":"7.2%","cholesterol":195,"risk_level":"MODERATE","risk_score":60,"summary":"Your HbA1c is 7.2% which is slightly above the target of 6.5%. Your blood sugar of 142 mg/dL is elevated and needs attention.","ai_insight":"Try reducing rice and sweet portions at dinner and take a 20-minute walk after meals.","lab_values":[{"parameter":"HbA1c","value":"7.2%","range":"< 6.5%","status":"high"},{"parameter":"Fasting Glucose","value":"142 mg/dL","range":"70-100","status":"high"},{"parameter":"Total Cholesterol","value":"195 mg/dL","range":"< 200","status":"normal"}],"flagged_items":[{"parameter":"HbA1c","value":"7.2%","concern":"3-month average glucose is above target"}],"recommendations":["Reduce rice and sugar in diet","30 min brisk walk daily","Take medications on time"]}

IMPORTANT: risk_level must be HIGH, MODERATE, or STABLE. lab_values status must be high, borderline, or normal.`;

        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: [
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
                    { type: "text", text: userPrompt },
                  ],
                },
              ],
              temperature: 0.1,
              max_tokens: 1500,
            }),
          });

          if (!groqRes.ok) {
            const errText = await groqRes.text();
            return json({ error: `Groq API ${groqRes.status}`, detail: errText.slice(0, 300) }, 500);
          }

          const data = await groqRes.json() as { choices: Array<{ message: { content: string } }> };
          const raw = data.choices?.[0]?.message?.content ?? "";
          const analysis = extractJSON(raw);

          if (!analysis) return json({ error: "Could not parse AI response", rawText: raw.slice(0, 200) }, 500);

          return json({ success: true, reportId, analysis });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return json({ error: "AI call failed", detail: msg }, 500);
        }
      },
    },
  },
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

function extractJSON(text: string): object | null {
  try { return JSON.parse(text.trim()); } catch {}
  const stripped = text.replace(/```(?:json)?/gi, "").trim();
  try { return JSON.parse(stripped); } catch {}
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) { try { return JSON.parse(text.slice(start, end + 1)); } catch {} }
  return null;
}
