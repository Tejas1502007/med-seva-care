export const patient = {
  name: "Rajesh Sharma",
  greeting: "Rajesh ji",
  age: 62,
  gender: "Male",
  phone: "+91 98765 43210",
  language: "Hindi",
  bloodGroup: "B+",
  conditions: ["Type 2 Diabetes", "Hypertension"],
  allergies: ["Penicillin"],
  emergencyContact: { name: "Priya Sharma", phone: "+91 98765 43211" },
  riskLevel: "MODERATE" as const,
  riskScore: 65,
};

export const vitals = {
  bloodSugar: { value: 142, unit: "mg/dL", trend: "+5%", status: "elevated" },
  bp: { value: "138/88", unit: "mmHg", status: "within" },
  adherence: { value: 85, unit: "%" },
  steps: { value: 4200, goal: 8000 },
};

export const weeklyVitals = [
  { day: "Mon", sugar: 138, bp: 135 },
  { day: "Tue", sugar: 145, bp: 138 },
  { day: "Wed", sugar: 142, bp: 140 },
  { day: "Thu", sugar: 148, bp: 142 },
  { day: "Fri", sugar: 140, bp: 138 },
  { day: "Sat", sugar: 144, bp: 136 },
  { day: "Sun", sugar: 142, bp: 138 },
];

export const adherenceWeek = [
  { day: "Mon", taken: 2, missed: 0 },
  { day: "Tue", taken: 2, missed: 0 },
  { day: "Wed", taken: 1, missed: 1 },
  { day: "Thu", taken: 2, missed: 0 },
  { day: "Fri", taken: 2, missed: 0 },
  { day: "Sat", taken: 2, missed: 0 },
  { day: "Sun", taken: 1, missed: 1 },
];

export const medications = [
  { id: "m1", name: "Metformin", quantity: 1, unit: "tablet", dose: "500mg", frequency: "Twice daily", time: "8:00 PM", times: ["08:00", "20:00"], notes: "Take with meals", status: "Pending", streak: 5 },
  { id: "m2", name: "Amlodipine", quantity: 1, unit: "tablet", dose: "5mg", frequency: "Once daily", time: "9:00 AM", times: ["09:00"], notes: "", status: "Taken", streak: 12 },
  { id: "m3", name: "Atorvastatin", quantity: 1, unit: "tablet", dose: "10mg", frequency: "Once daily", time: "10:00 PM", times: ["22:00"], notes: "Take before bed", status: "Pending", streak: 8 },
];

export const dietPlan = {
  basis: "Based on your HbA1c 7.2 & BP 138/88",
  meals: [
    { type: "Breakfast", emoji: "🍳", name: "Vegetable Upma with Sprouts", calories: 320, tag: "Low Glycemic", reason: "Suits your current HbA1c target" },
    { type: "Lunch", emoji: "🍛", name: "Jowar Roti with Dal & Sabzi", calories: 480, tag: "Heart Healthy", reason: "Low sodium for your BP" },
    { type: "Dinner", emoji: "🥗", name: "Grilled Paneer with Salad", calories: 380, tag: "High Protein", reason: "Avoids late-night sugar spike" },
    { type: "Snacks", emoji: "🥜", name: "Roasted Chana & Buttermilk", calories: 180, tag: "Diabetic Friendly", reason: "Keeps blood sugar steady" },
  ],
};

export const reports = [
  { id: "r1", name: "Blood Test Report — Apollo Diagnostics", date: "20 Jun 2026", doctor: "Dr. Ananya Iyer", status: "Analyzed" as const },
  { id: "r2", name: "Lipid Profile — Thyrocare", date: "12 Jun 2026", doctor: "Dr. Anjali Kapoor", status: "Analyzed" as const },
  { id: "r3", name: "HbA1c Test — Metropolis Labs", date: "5 Jun 2026", doctor: "Dr. Ananya Iyer", status: "Flagged" as const },
  { id: "r4", name: "ECG Report — Fortis Hospital", date: "28 May 2026", doctor: "Dr. Vikram Mehra", status: "Analyzing" as const },
];

export const labValues = [
  { parameter: "HbA1c", value: "7.2%", range: "< 6.5%", status: "high" as const },
  { parameter: "Fasting Glucose", value: "142 mg/dL", range: "70 - 100", status: "high" as const },
  { parameter: "Total Cholesterol", value: "195 mg/dL", range: "< 200", status: "normal" as const },
  { parameter: "LDL", value: "118 mg/dL", range: "< 100", status: "borderline" as const },
  { parameter: "HDL", value: "48 mg/dL", range: "> 40", status: "normal" as const },
  { parameter: "Triglycerides", value: "165 mg/dL", range: "< 150", status: "borderline" as const },
  { parameter: "Creatinine", value: "0.9 mg/dL", range: "0.7 - 1.3", status: "normal" as const },
];

export const doctor = {
  name: "Dr. Ananya Iyer",
  role: "Senior Endocrinologist",
  initials: "AI",
};

export const queueStats = { total: 42, high: 5, moderate: 12, stable: 25 };

export type RiskLevel = "HIGH" | "MODERATE" | "STABLE";

export const patientQueue = [
  {
    id: "p1", name: "Rajesh Sharma", age: 62, gender: "M",
    condition: "T2DM + HTN", risk: "MODERATE" as RiskLevel,
    insight: "Fasting glucose trending up over 7 days. Consider adjusting evening Metformin dose.",
    critical: false,
    vitals: [{ label: "GLUCOSE", value: "142 mg/dL", high: true }, { label: "BP", value: "138/88", high: false }],
  },
  {
    id: "p2", name: "Priya Nair", age: 54, gender: "F",
    condition: "Type 2 Diabetes", risk: "HIGH" as RiskLevel,
    insight: "Severe hyperglycemia detected. Glucose 264 mg/dL — recommend immediate intervention.",
    critical: true,
    vitals: [{ label: "GLUCOSE", value: "264 mg/dL", high: true }, { label: "BP", value: "152/96", high: true }],
  },
  {
    id: "p3", name: "Vikram Mehra", age: 58, gender: "M",
    condition: "Hypertension", risk: "STABLE" as RiskLevel,
    insight: "BP stable over 14 days. Continue current regimen and monthly review.",
    critical: false,
    vitals: [{ label: "BP", value: "122/80", high: false }, { label: "HR", value: "72 bpm", high: false }],
  },
  {
    id: "p4", name: "Anita Desai", age: 49, gender: "F",
    condition: "CKD Stage 2", risk: "MODERATE" as RiskLevel,
    insight: "Creatinine creeping up. Recommend nephrology consult within 2 weeks.",
    critical: false,
    vitals: [{ label: "CREATININE", value: "1.6 mg/dL", high: true }, { label: "BP", value: "134/84", high: false }],
  },
  {
    id: "p5", name: "Mohan Iyer", age: 65, gender: "M",
    condition: "Post-Op Cardiac", risk: "HIGH" as RiskLevel,
    insight: "Post-op day 14: irregular pulse pattern detected. Schedule urgent telecardiology review.",
    critical: true,
    vitals: [{ label: "HR", value: "98 bpm", high: true }, { label: "BP", value: "146/92", high: true }],
  },
  {
    id: "p6", name: "Sunita Joshi", age: 57, gender: "F",
    condition: "Type 2 Diabetes", risk: "STABLE" as RiskLevel,
    insight: "Excellent adherence. HbA1c reduced from 8.1 → 6.9 over 3 months.",
    critical: false,
    vitals: [{ label: "GLUCOSE", value: "118 mg/dL", high: false }, { label: "BP", value: "126/78", high: false }],
  },
];

export const bp30Days = Array.from({ length: 30 }, (_, i) => {
  const base = 130 + Math.sin(i / 4) * 8 + (i % 5 === 0 ? 12 : 0);
  return { day: i + 1, systolic: Math.round(base), elevated: base > 140 };
});

export const glucose30Days = Array.from({ length: 30 }, (_, i) => {
  const base = 130 + Math.cos(i / 3) * 15 + (i === 12 ? 60 : 0) + (i === 24 ? 50 : 0);
  return { day: i + 1, value: Math.round(base), critical: base > 180 };
});

export const consultationTimeline = [
  { date: "22 Jun 2026 • 10:30 AM", doctor: "Dr. Ananya Iyer", note: "Patient reports improved energy. Continue Metformin 500mg BD. Advised home glucose monitoring twice daily." },
  { date: "15 Jun 2026 • 4:00 PM", doctor: "Dr. Anjali Kapoor", note: "Reviewed lipid profile. LDL slightly elevated. Started Atorvastatin 10mg OD. Follow-up in 4 weeks." },
  { date: "1 Jun 2026 • 11:15 AM", doctor: "Dr. Ananya Iyer", note: "Initial assessment for chronic care plan. HbA1c 7.4, BP 142/90. Started on Amlodipine 5mg." },
];
