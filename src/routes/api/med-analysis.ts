import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/med-analysis")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { medName, dose, frequency, time, conditions } = (await request.json()) as {
          medName: string;
          dose: string;
          frequency: string;
          time?: string;
          conditions?: string[];
        };

        const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
        if (!key) return json({ error: "Missing VITE_GROQ_API_KEY" }, 500);

        const prompt = `Explain this medication to an Indian patient in very simple language (like talking to a family member):

Medication: ${medName}
Dose: ${dose}
Frequency: ${frequency}
Time: ${time ?? "as prescribed"}
Patient conditions: ${conditions?.join(", ") || "chronic disease"}

Respond in 4 short sections using this exact format:
WHAT: [1 sentence — what this medicine does in simple words]
WHY: [1 sentence — why they are taking it for their condition]  
HOW: [1 sentence — best way to take it, with or without food]
TIPS: [1-2 short tips — side effects to watch for or lifestyle tips]

Keep it warm, simple, under 80 words total. No medical jargon. Use Indian context where relevant.`;

        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: "You are a friendly medical assistant explaining medications to Indian patients in simple language." },
                { role: "user", content: prompt },
              ],
              temperature: 0.4,
              max_tokens: 300,
            }),
          });

          if (!res.ok) return json({ error: "Groq error" }, 500);
          const data = await res.json() as { choices: Array<{ message: { content: string } }> };
          const text = data.choices?.[0]?.message?.content ?? "";
          return json({ success: true, analysis: text });
        } catch (err) {
          return json({ error: String(err) }, 500);
        }
      },
    },
  },
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json" },
  });
}
