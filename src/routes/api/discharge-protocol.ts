import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/discharge-protocol")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { base64, mimeType, fileName } = (await request.json()) as {
          base64: string;
          mimeType: string;
          fileName: string;
        };

        if (!base64) return json({ error: "No image data provided" }, 400);

        const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
        if (!key) return json({ error: "Missing VITE_GROQ_API_KEY" }, 500);

        const systemPrompt = `You are a clinical AI assistant specialized in Indian hospital discharge summaries. 
Parse the discharge summary image and return ONLY valid JSON with no markdown, no explanation:
{
  "patient_name": "string",
  "primary_diagnosis": "string",
  "secondary_diagnoses": ["string"],
  "diagnosis_category": "cardiac" | "diabetes" | "surgical" | "respiratory" | "general",
  "discharge_medications": [{"name": "string", "dose": "string", "frequency": "string", "timing": "string"}],
  "follow_up_date": "string | null",
  "follow_up_doctor": "string | null",
  "activity_restrictions": ["string"],
  "dietary_restrictions": ["string"],
  "warning_signs": ["string"],
  "discharge_date": "string | null"
}`;

        const DEMO_DATA = {
          patient_name: "Rajesh Sharma",
          primary_diagnosis: "Acute Myocardial Infarction (STEMI)",
          secondary_diagnoses: ["Hypertension", "Type 2 Diabetes Mellitus"],
          diagnosis_category: "cardiac",
          discharge_medications: [
            { name: "Aspirin", dose: "75mg", frequency: "Once daily", timing: "After breakfast" },
            { name: "Atorvastatin", dose: "40mg", frequency: "Once daily", timing: "At bedtime" },
            { name: "Metoprolol", dose: "25mg", frequency: "Twice daily", timing: "Morning and evening" },
            { name: "Ramipril", dose: "5mg", frequency: "Once daily", timing: "Morning" },
            { name: "Clopidogrel", dose: "75mg", frequency: "Once daily", timing: "After breakfast" },
          ],
          follow_up_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          follow_up_doctor: "Dr. Priya Mehta (Cardiologist)",
          activity_restrictions: [
            "No climbing stairs for 2 weeks",
            "No lifting more than 2kg for 4 weeks",
            "No driving for 4 weeks",
            "Avoid strenuous exercise for 6 weeks",
          ],
          dietary_restrictions: [
            "Low salt diet (< 2g sodium/day)",
            "Low fat diet",
            "Avoid fried and oily foods",
            "Limit sugar intake",
          ],
          warning_signs: [
            "Chest pain or tightness",
            "Shortness of breath at rest",
            "Swelling in legs or ankles",
            "Severe dizziness or fainting",
            "Palpitations or irregular heartbeat",
          ],
          discharge_date: new Date().toISOString().split("T")[0],
        };

        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: [
                    {
                      type: "image_url",
                      image_url: { url: `data:${mimeType};base64,${base64}` },
                    },
                    {
                      type: "text",
                      text: `Parse this discharge summary and return the JSON as specified. File: ${fileName}`,
                    },
                  ],
                },
              ],
              temperature: 0.1,
              max_tokens: 2000,
            }),
          });

          if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.warn("Groq API error, using demo data:", errText.slice(0, 200));
            return json({ success: true, parsed: DEMO_DATA, demo: true });
          }

          const data = (await groqRes.json()) as {
            choices: Array<{ message: { content: string } }>;
          };
          const raw = data.choices?.[0]?.message?.content ?? "";
          const parsed = extractJSON(raw);

          if (!parsed) {
            console.warn("JSON parse failed, using demo data. Raw:", raw.slice(0, 200));
            return json({ success: true, parsed: DEMO_DATA, demo: true });
          }

          return json({ success: true, parsed, demo: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn("AI call failed, using demo data:", msg);
          return json({ success: true, parsed: DEMO_DATA, demo: true });
        }
      },
    },
  },
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function extractJSON(text: string): object | null {
  try {
    return JSON.parse(text.trim());
  } catch {}
  const stripped = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(stripped);
  } catch {}
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {}
  }
  return null;
}
