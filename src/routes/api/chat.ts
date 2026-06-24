import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SYSTEM_PROMPT = `You are AARA, MedSeva's warm and empathetic AI health companion for Indian patients. Patient: Rajesh Sharma, 62M, Type 2 Diabetes + Hypertension, medications: Metformin 500mg (BD), Amlodipine 5mg (OD), Atorvastatin 10mg (OD). Recent vitals: Blood Sugar 142 mg/dL, BP 138/88, HbA1c 7.2.

Respond in under 80 words. Be warm, respectful (address him as "Rajesh ji"), and use simple language an older Indian patient understands. Reference Indian foods (dal, roti, sabzi) when discussing diet. Always recommend consulting his doctor for serious concerns. Never diagnose. Be encouraging about small wins.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
