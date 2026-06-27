import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/vapi-call")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { phoneNumber, patientName } = (await request.json()) as {
            phoneNumber: string;
            patientName: string;
          };

          if (!phoneNumber) {
            return new Response(JSON.stringify({ error: "Phone number is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Normalize to E.164 format
          let normalized = phoneNumber.replace(/[\s\-().]/g, "");
          if (!normalized.startsWith("+")) {
            // Strip leading 0 if present
            if (normalized.startsWith("0")) normalized = normalized.slice(1);
            // Default to India +91 if 10 digits
            if (normalized.length === 10) normalized = `+91${normalized}`;
            else normalized = `+${normalized}`;
          }

          const privateKey = process.env.VAPI_PRIVATE_KEY;
          const assistantId = process.env.VAPI_ASSISTANT_ID;
          const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

          console.log("🔑 VAPI_PRIVATE_KEY present:", !!privateKey, "length:", privateKey?.length);
          console.log("🤖 VAPI_ASSISTANT_ID:", assistantId);
          console.log("📞 VAPI_PHONE_NUMBER_ID:", phoneNumberId);
          console.log("📱 Normalized phone:", normalized);

          if (!privateKey || !assistantId || !phoneNumberId) {
            console.error("❌ Missing Vapi credentials");
            return new Response(JSON.stringify({ error: "Vapi credentials not configured", debug: { privateKey: !!privateKey, assistantId: !!assistantId, phoneNumberId: !!phoneNumberId } }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body: Record<string, any> = {
            assistantId,
            phoneNumberId,
            customer: {
              number: normalized,
              name: patientName || "Patient",
            },
            assistantOverrides: {
              variableValues: {
                patientName: patientName || "Patient",
              },
            },
          };

          const response = await fetch("https://api.vapi.ai/call/phone", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${privateKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });

          console.log("📡 Vapi response status:", response.status);

          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error("❌ Vapi error response:", JSON.stringify(err));
            return new Response(
              JSON.stringify({ error: err.message || "Failed to initiate call", details: err }),
              { status: response.status, headers: { "Content-Type": "application/json" } }
            );
          }

          const data = await response.json();
          console.log("✅ Vapi call created:", data.id, "status:", data.status);
          return new Response(JSON.stringify({ success: true, callId: data.id, status: data.status }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
