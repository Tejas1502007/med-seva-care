import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = `You are AARA, MedSeva's warm and empathetic AI health companion for Indian patients managing chronic conditions like diabetes and hypertension.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          console.log("✅ Chat API endpoint hit!");
          
          const body = (await request.json()) as any;
          console.log("📨 Received body:", JSON.stringify(body).substring(0, 100));
          
          // The ai SDK sends messages as an array with id, role, content
          const messages = body?.messages || [];
          console.log("📝 Messages count:", messages.length);
          console.log("📋 Message structure:", JSON.stringify(messages.map((m: any) => ({ role: m.role, content: String(m.content).substring(0, 30) }))));

          if (!messages.length) {
            console.log("⚠️ No messages");
            return new Response(
              JSON.stringify({ 
                id: "auto-0",
                role: "assistant", 
                content: "Hello! I'm AARA."
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          // Get key
          const key = process.env.VITE_GROQ_API_KEY;
          console.log("🔑 Key check - Present:", !!key, "Length:", key?.length);

          if (!key) {
            console.error("❌ No API key found!");
            return new Response(
              JSON.stringify({ 
                id: "auto-err",
                role: "assistant", 
                content: "API key missing" 
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          // Format messages - extract just what Groq needs
          const formattedMessages = messages
            .map((m: any) => ({
              role: m.role || "user",
              content: typeof m.content === "string" ? m.content : String(m.content),
            }))
            .filter((m: any) => m.content?.trim());

          console.log("✅ Formatted", formattedMessages.length, "messages for Groq");

          // Call Groq
          console.log("🚀 Calling Groq API...");
          
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [{ role: "system", content: SYSTEM_PROMPT }, ...formattedMessages],
              temperature: 0.7,
              max_tokens: 250,
            }),
          });

          console.log("📊 Groq response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Groq error:", response.status, errorText.substring(0, 200));
            return new Response(
              JSON.stringify({ 
                id: "auto-err",
                role: "assistant", 
                content: `Error: ${response.status}` 
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          const result = await response.json() as any;
          const reply = result.choices?.[0]?.message?.content || "No response";
          
          console.log("✅ Success! Reply:", reply.substring(0, 50));

          // Return proper format for ai SDK
          return new Response(
            JSON.stringify({ 
              id: `msg-${Date.now()}`,
              role: "assistant", 
              content: reply 
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.error("❌ Error:", error);
          return new Response(
            JSON.stringify({ 
              id: "auto-err",
              role: "assistant", 
              content: `Error: ${String(error)}` 
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
