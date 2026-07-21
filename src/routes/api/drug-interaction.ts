import { createFileRoute } from "@tanstack/react-router";

// Local hardcoded interaction database — covers most common Indian chronic disease combos
const INTERACTION_DB = [
  { drugs: ["metformin", "ciprofloxacin"], severity: "HIGH", explanation: "Ciprofloxacin can mask low blood sugar symptoms caused by Metformin, making hypoglycemia dangerous and hard to detect.", action: "Avoid this combination. If antibiotic is needed, ask your doctor for an alternative." },
  { drugs: ["metformin", "alcohol"], severity: "HIGH", explanation: "Combining Metformin with alcohol can cause lactic acidosis — a rare but life-threatening buildup of lactic acid in the blood.", action: "Avoid alcohol completely while taking Metformin." },
  { drugs: ["metformin", "iodinated contrast"], severity: "HIGH", explanation: "Iodinated contrast dye used in CT scans can cause kidney damage when combined with Metformin, leading to lactic acidosis.", action: "Stop Metformin 48 hours before any CT scan with contrast. Restart only after doctor confirms kidney function is normal." },
  { drugs: ["amlodipine", "clarithromycin"], severity: "HIGH", explanation: "Clarithromycin blocks the breakdown of Amlodipine in the body, causing dangerous blood pressure drops and dizziness.", action: "Do not take together. Ask your doctor for an alternative antibiotic like Azithromycin." },
  { drugs: ["atorvastatin", "clarithromycin"], severity: "HIGH", explanation: "Clarithromycin increases Atorvastatin levels in the blood dramatically, risking severe muscle breakdown (rhabdomyolysis) which can damage kidneys.", action: "Stop Atorvastatin while taking Clarithromycin. Resume after completing the antibiotic course." },
  { drugs: ["atorvastatin", "gemfibrozil"], severity: "HIGH", explanation: "Both drugs together greatly increase the risk of muscle breakdown (myopathy/rhabdomyolysis), which can cause kidney failure.", action: "This combination should be avoided. Discuss alternative cholesterol management with your doctor." },
  { drugs: ["warfarin", "aspirin"], severity: "HIGH", explanation: "Both are blood thinners. Together they dramatically increase the risk of serious internal bleeding, including stomach and brain bleeds.", action: "Only use together if specifically prescribed by your doctor with close monitoring. Report any unusual bruising or bleeding immediately." },
  { drugs: ["warfarin", "ibuprofen"], severity: "HIGH", explanation: "Ibuprofen increases Warfarin's blood-thinning effect and also irritates the stomach lining, causing a high risk of serious bleeding.", action: "Avoid Ibuprofen and all NSAIDs while on Warfarin. Use Paracetamol for pain relief instead." },
  { drugs: ["warfarin", "diclofenac"], severity: "HIGH", explanation: "Diclofenac increases Warfarin's blood-thinning effect and irritates the stomach, causing a high risk of serious bleeding.", action: "Avoid Diclofenac while on Warfarin. Use Paracetamol for pain relief instead." },
  { drugs: ["ramipril", "potassium"], severity: "MODERATE", explanation: "Ramipril already raises potassium levels. Adding potassium supplements can cause dangerously high potassium (hyperkalemia), which affects heart rhythm.", action: "Avoid potassium supplements unless specifically prescribed. Get blood potassium checked regularly." },
  { drugs: ["ramipril", "ibuprofen"], severity: "MODERATE", explanation: "Ibuprofen reduces the blood pressure-lowering effect of Ramipril and can damage kidneys when both are taken together.", action: "Avoid Ibuprofen while on Ramipril. Use Paracetamol for pain relief." },
  { drugs: ["aspirin", "ibuprofen"], severity: "MODERATE", explanation: "Ibuprofen blocks Aspirin from protecting the heart. If you take Aspirin for heart protection, Ibuprofen makes it less effective.", action: "Take Aspirin at least 30 minutes before Ibuprofen, or use Paracetamol instead of Ibuprofen." },
  { drugs: ["furosemide", "gentamicin"], severity: "HIGH", explanation: "Both drugs can damage hearing and kidneys. Together the risk is much higher, potentially causing permanent hearing loss and kidney failure.", action: "This combination requires very close medical supervision. Report any hearing changes or reduced urination immediately." },
  { drugs: ["digoxin", "amiodarone"], severity: "HIGH", explanation: "Amiodarone increases Digoxin levels in the blood to toxic levels, causing dangerous heart rhythm problems.", action: "If both are needed, Digoxin dose must be reduced by 50%. Requires regular blood level monitoring." },
  { drugs: ["glipizide", "fluconazole"], severity: "HIGH", explanation: "Fluconazole (antifungal) blocks the breakdown of Glipizide, causing severe and prolonged low blood sugar (hypoglycemia).", action: "Avoid this combination. If antifungal is needed, ask your doctor for an alternative." },
  { drugs: ["metoprolol", "verapamil"], severity: "HIGH", explanation: "Both drugs slow the heart. Together they can cause the heart to beat dangerously slowly (heart block) or even stop.", action: "This combination is generally contraindicated. Do not take together without specialist supervision." },
  { drugs: ["sildenafil", "nitrates"], severity: "HIGH", explanation: "Both drugs lower blood pressure. Together they can cause a sudden, fatal drop in blood pressure.", action: "Never take Sildenafil (Viagra) if you are on any nitrate medication (like Sorbitrate, Isosorbide). This can be fatal." },
  { drugs: ["prednisolone", "ibuprofen"], severity: "MODERATE", explanation: "Both drugs irritate the stomach lining. Together they significantly increase the risk of stomach ulcers and bleeding.", action: "If both are needed, take a stomach-protecting medicine (like Pantoprazole) and take with food." },
  { drugs: ["ciprofloxacin", "antacids"], severity: "LOW", explanation: "Antacids containing calcium, magnesium or aluminium bind to Ciprofloxacin in the stomach and reduce its absorption by up to 90%.", action: "Take Ciprofloxacin at least 2 hours before or 6 hours after antacids." },
  { drugs: ["levothyroxine", "calcium"], severity: "LOW", explanation: "Calcium supplements bind to Levothyroxine in the stomach and reduce its absorption, making the thyroid medication less effective.", action: "Take Levothyroxine on an empty stomach in the morning. Take calcium supplements at least 4 hours later." },
];

function normalize(name: string) {
  return name.toLowerCase().trim();
}

function checkLocalInteractions(drugs: string[]) {
  const normalized = drugs.map(normalize);
  const found: typeof INTERACTION_DB = [];

  for (const interaction of INTERACTION_DB) {
    const matchCount = interaction.drugs.filter((d) =>
      normalized.some((n) => n.includes(d) || d.includes(n))
    ).length;
    if (matchCount >= 2) found.push(interaction);
  }

  return found;
}

export const Route = createFileRoute("/api/drug-interaction")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { drugs } = (await request.json()) as { drugs: string[] };

        if (!drugs || drugs.length < 2) {
          return json({ error: "Please provide at least 2 drug names" }, 400);
        }

        const key = process.env.VITE_GROQ_API_KEY;
        if (!key) return json({ error: "Missing GROQ API key" }, 500);

        // Step 1 — local DB check (instant, no API needed)
        const localInteractions = checkLocalInteractions(drugs);

        // Step 2 — Groq for additional analysis
        const prompt = `You are a clinical pharmacist AI. Review this list of medications a patient is taking: ${drugs.join(", ")}.

Identify any dangerous interactions NOT already in this list: ${localInteractions.map((i) => i.drugs.join(" + ")).join(", ") || "none"}.

Return ONLY a JSON array. Each item must have: drugs (array of 2 drug names), severity ("HIGH", "MODERATE", or "LOW"), explanation (under 50 words, plain language for a 60-year-old Indian patient), action (what to do).

If no additional interactions found, return empty array [].`;

        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.1,
              max_tokens: 800,
            }),
          });

          let aiInteractions: typeof INTERACTION_DB = [];
          if (res.ok) {
            const data = await res.json() as { choices: Array<{ message: { content: string } }> };
            const raw = data.choices?.[0]?.message?.content ?? "[]";
            try {
              const cleaned = raw.replace(/```json|```/g, "").trim();
              const parsed = JSON.parse(cleaned);
              if (Array.isArray(parsed)) aiInteractions = parsed;
            } catch { /* ignore parse errors, local DB is enough */ }
          }

          const allInteractions = [...localInteractions, ...aiInteractions];

          return json({
            success: true,
            drugs,
            interactions: allInteractions,
            checkedAt: new Date().toISOString(),
          });
        } catch (err) {
          // Even if Groq fails, return local DB results
          return json({
            success: true,
            drugs,
            interactions: localInteractions,
            checkedAt: new Date().toISOString(),
            note: "AI analysis unavailable — showing local database results",
          });
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
