import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  QrCode, KeyRound, ShieldCheck, Loader2, AlertTriangle,
  User, HeartPulse, Pill, FileText, Eye, EyeOff,
  RefreshCw, Upload, Camera, X, Activity, ExternalLink, FolderOpen,
} from "lucide-react";

export const Route = createFileRoute("/_doctor/doctor/scan-qr")({
  head: () => ({ meta: [{ title: "Scan Patient QR — MedSeva" }] }),
  component: DoctorScanQR,
});

interface PatientData {
  profile: { full_name: string | null; email: string; phone: string | null } | null;
  patient: {
    age: number | null; dob: string | null; gender: string | null;
    blood_group: string | null; height: number | null; weight: number | null;
    conditions: string[]; allergies: string[]; risk_level: string;
    risk_score: number | null;
    emergency_contact: { name?: string; phone?: string } | null;
  } | null;
  vitals: { type: string; value: number; unit: string; notes: string | null; recorded_at: string }[];
  reports: { id: string; name: string; report_date: string; status: string; ai_summary: string | null; lab_values: { parameter: string; value: string; range: string; status: string }[] | null; file_url: string | null }[];
  medications: { name: string; dose: string; frequency: string; times: string[] | null; unit: string | null; quantity: number | null; streak: number }[];
  documents: Record<string, { name: string; url: string }[]>;
}

type Step = "input" | "pin" | "view";
type InputMode = "paste" | "upload" | "camera";

function DoctorScanQR() {
  const [step, setStep] = useState<Step>("input");
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [urlInput, setUrlInput] = useState("");
  const [token, setToken] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PatientData | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "vitals" | "reports" | "medications" | "documents">("profile");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) { clearInterval(scanIntervalRef.current); scanIntervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Load jsQR from CDN once
  const loadJsQR = (): Promise<(data: Uint8ClampedArray, w: number, h: number) => { data: string } | null> =>
    new Promise((resolve) => {
      // @ts-ignore
      if (window.jsQR) { resolve(window.jsQR); return; }
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
      s.onload = () => resolve((window as any).jsQR);
      s.onerror = () => resolve(() => null);
      document.head.appendChild(s);
    });

  // Draw any source to canvas and return ImageData
  const toImageData = (source: HTMLVideoElement | HTMLImageElement | ImageBitmap): ImageData | null => {
    try {
      const w = source instanceof HTMLVideoElement ? source.videoWidth : (source as any).width;
      const h = source instanceof HTMLVideoElement ? source.videoHeight : (source as any).height;
      if (!w || !h) return null;
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);
      return ctx.getImageData(0, 0, w, h);
    } catch { return null; }
  };

  // Decode QR: jsQR first (universal), BarcodeDetector as secondary
  const decodeQR = async (source: HTMLVideoElement | HTMLImageElement | ImageBitmap): Promise<string | null> => {
    // Primary: jsQR via canvas pixel data — works everywhere
    const jsQR = await loadJsQR();
    const imageData = toImageData(source);
    if (jsQR && imageData) {
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      if (result?.data) return result.data;
    }
    // Secondary: BarcodeDetector (Chrome/Edge native)
    if ("BarcodeDetector" in window) {
      try {
        // @ts-ignore
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const codes = await detector.detect(source);
        if (codes.length > 0) return codes[0].rawValue as string;
      } catch { /* unsupported */ }
    }
    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setScanLoading(true);
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
      const result = await decodeQR(img);
      URL.revokeObjectURL(url);
      if (result) {
        const t = parseToken(result);
        if (t) { setToken(t); setStep("pin"); }
        else setError("QR code found but URL format is invalid.");
      } else {
        setError("Could not read QR code. Make sure the image is clear and well-lit.");
      }
    } catch {
      setError("Failed to process image.");
    } finally {
      setScanLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      // Poll every 400ms
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        const result = await decodeQR(videoRef.current);
        if (result) {
          stopCamera();
          const t = parseToken(result);
          if (t) { setToken(t); setStep("pin"); }
          else setError("QR code scanned but URL format is invalid.");
        }
      }, 400);
    } catch (err: any) {
      setCameraError(err?.message?.includes("Permission") ? "Camera permission denied." : "Could not access camera.");
    }
  };

  // Extract token from URL
  const parseToken = (raw: string): string | null => {
    try {
      const url = raw.includes("://") ? new URL(raw) : new URL("https://x.com" + (raw.startsWith("/") ? raw : "/" + raw));
      const parts = url.pathname.split("/").filter(Boolean);
      // expects /share/<token>
      if (parts[0] === "share" && parts[1]) return parts[1];
    } catch { /* not a URL */ }
    // maybe they pasted just the token directly
    if (/^[a-f0-9]{32}$/.test(raw.trim())) return raw.trim();
    return null;
  };

  const handleUrlSubmit = () => {
    setError(null);
    const t = parseToken(urlInput.trim());
    if (!t) { setError("Invalid QR link. Paste the full URL from the patient's QR code."); return; }
    setToken(t);
    setStep("pin");
  };

  const handlePinChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...pin];
    next[idx] = val;
    setPin(next);
    if (val && idx < 3) (document.getElementById(`dpin-${idx + 1}`) as HTMLInputElement)?.focus();
  };

  const handlePinKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0)
      (document.getElementById(`dpin-${idx - 1}`) as HTMLInputElement)?.focus();
  };

  const handlePinSubmit = async () => {
    const pinStr = pin.join("");
    if (pinStr.length !== 4) { setError("Enter all 4 digits"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/qr-share/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pin: pinStr }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error ?? "Access denied"); setLoading(false); return; }
      setData(json.data as PatientData);
      setStep("view");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    stopCamera();
    setStep("input"); setInputMode("paste"); setUrlInput(""); setToken("");
    setPin(["", "", "", ""]); setError(null); setData(null); setCameraError(null);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "#1A2332" }}>Scan Patient QR</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            Access a patient's shared health records securely using their QR link and PIN.
          </p>
        </div>
        {step !== "input" && (
          <button onClick={reset}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border text-sm font-medium hover:bg-gray-50"
            style={{ borderColor: "#E8ECF0", color: "#374151" }}>
            <RefreshCw size={14} /> New Scan
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: "Enter QR Link", s: "input" },
          { n: 2, label: "Enter PIN", s: "pin" },
          { n: 3, label: "View Records", s: "view" },
        ].map(({ n, label, s }, i, arr) => {
          const done = (step === "pin" && n === 1) || (step === "view" && n <= 2);
          const active = step === s;
          return (
            <div key={n} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: done ? "#0D7A5F" : active ? "#E8F5F1" : "#F3F4F6",
                    color: done ? "#fff" : active ? "#0D7A5F" : "#9CA3AF",
                    border: active ? "2px solid #0D7A5F" : "2px solid transparent",
                  }}>
                  {done ? "✓" : n}
                </div>
                <span className="text-xs font-medium hidden sm:block"
                  style={{ color: active ? "#0D7A5F" : done ? "#374151" : "#9CA3AF" }}>
                  {label}
                </span>
              </div>
              {i < arr.length - 1 && <div className="w-8 h-px" style={{ background: "#E8ECF0" }} />}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Enter URL ── */}
      {step === "input" && (
        <div className="card-base p-8 max-w-lg mx-auto">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#E8F5F1" }}>
              <QrCode size={32} color="#0D7A5F" />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "#1A2332" }}>Scan Patient QR</h2>
            <p className="text-sm text-center mt-1" style={{ color: "#6B7280" }}>
              Upload the QR image, scan with camera, or paste the link.
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: "#F3F4F6" }}>
            {([
              { id: "upload" as InputMode, label: "Upload Image", icon: Upload },
              { id: "camera" as InputMode, label: "Camera", icon: Camera },
              { id: "paste" as InputMode, label: "Paste URL", icon: QrCode },
            ]).map(({ id, label, icon: Icon }) => (
              <button key={id}
                onClick={() => { setInputMode(id); setError(null); setCameraError(null); if (id !== "camera") stopCamera(); }}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: inputMode === id ? "#fff" : "transparent",
                  color: inputMode === id ? "#0D7A5F" : "#6B7280",
                  boxShadow: inputMode === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {/* Upload mode */}
          {inputMode === "upload" && (
            <div className="space-y-4">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={scanLoading}
                className="w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors hover:border-[#0D7A5F] hover:bg-[#E8F5F1]"
                style={{ borderColor: "#D1D5DB" }}>
                {scanLoading
                  ? <Loader2 size={24} color="#0D7A5F" className="animate-spin" />
                  : <>
                      <Upload size={24} color="#9CA3AF" />
                      <span className="text-sm font-medium" style={{ color: "#6B7280" }}>Click to upload QR image</span>
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>PNG, JPG, WEBP supported</span>
                    </>}
              </button>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#FEF2F2" }}>
                  <AlertTriangle size={14} color="#B91C1C" />
                  <span className="text-sm" style={{ color: "#B91C1C" }}>{error}</span>
                </div>
              )}
              <p className="text-xs text-center" style={{ color: "#9CA3AF" }}>
                Works in all modern browsers
              </p>
            </div>
          )}

          {/* Camera mode */}
          {inputMode === "camera" && (
            <div className="space-y-3">
              <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "4/3" }}>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Camera size={32} color="#9CA3AF" />
                    <button onClick={startCamera}
                      className="h-10 px-5 rounded-xl font-semibold text-white text-sm"
                      style={{ background: "#0D7A5F" }}>
                      Start Camera
                    </button>
                  </div>
                )}
                {cameraActive && (
                  <>
                    {/* Viewfinder overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 rounded-xl" style={{ borderColor: "#0D7A5F", boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)" }} />
                    </div>
                    <button onClick={stopCamera}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.5)" }}>
                      <X size={14} color="#fff" />
                    </button>
                    <div className="absolute bottom-3 left-0 right-0 text-center">
                      <span className="text-xs text-white px-3 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.5)" }}>
                        Point camera at QR code
                      </span>
                    </div>
                  </>
                )}
              </div>
              {(cameraError || error) && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#FEF2F2" }}>
                  <AlertTriangle size={14} color="#B91C1C" />
                  <span className="text-sm" style={{ color: "#B91C1C" }}>{cameraError ?? error}</span>
                </div>
              )}
              <p className="text-xs text-center" style={{ color: "#9CA3AF" }}>
                Works in all modern browsers · Camera permission needed
              </p>
            </div>
          )}

          {/* Paste URL mode */}
          {inputMode === "paste" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>
                  QR Link or URL
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                  placeholder="https://medseva.app/share/abc123..."
                  className="w-full h-11 px-3 rounded-xl border outline-none text-sm"
                  style={{ borderColor: "#D1D5DB", color: "#1A2332" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#0D7A5F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,122,95,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }}
                  autoFocus
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#FEF2F2" }}>
                  <AlertTriangle size={14} color="#B91C1C" />
                  <span className="text-sm" style={{ color: "#B91C1C" }}>{error}</span>
                </div>
              )}
              <button onClick={handleUrlSubmit} disabled={!urlInput.trim()}
                className="w-full h-11 rounded-xl font-semibold text-white text-sm disabled:opacity-50"
                style={{ background: "#0D7A5F" }}>
                Continue to PIN →
              </button>
            </div>
          )}

          <div className="mt-6 p-4 rounded-xl" style={{ background: "#F7F8FA" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "#374151" }}>How it works:</p>
            <ol className="text-xs space-y-1" style={{ color: "#6B7280" }}>
              <li>1. Patient opens MedSeva → Share Records → generates QR</li>
              <li>2. Upload the QR image, scan it with camera, or paste the link</li>
              <li>3. Enter the 4-digit PIN the patient tells you verbally</li>
            </ol>
          </div>
        </div>
      )}

      {/* ── Step 2: PIN Entry ── */}
      {step === "pin" && (
        <div className="card-base p-8 max-w-lg mx-auto">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#E8F5F1" }}>
              <KeyRound size={32} color="#0D7A5F" />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "#1A2332" }}>Enter 4-Digit PIN</h2>
            <p className="text-sm text-center mt-1" style={{ color: "#6B7280" }}>
              Ask the patient for their PIN. They can see it in their Share Records page.
            </p>
          </div>

          <div className="flex gap-3 justify-center mb-4">
            {pin.map((digit, i) => (
              <input
                key={i}
                id={`dpin-${i}`}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(i, e.target.value)}
                onKeyDown={(e) => handlePinKey(i, e)}
                className="w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all"
                style={{
                  borderColor: digit ? "#0D7A5F" : "#D1D5DB",
                  background: digit ? "#E8F5F1" : "#fff",
                  color: "#1A2332",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#0D7A5F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13,122,95,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = digit ? "#0D7A5F" : "#D1D5DB"; e.currentTarget.style.boxShadow = "none"; }}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <button type="button" onClick={() => setShowPin(!showPin)}
            className="flex items-center gap-1.5 mx-auto text-xs mb-5" style={{ color: "#9CA3AF" }}>
            {showPin ? <EyeOff size={13} /> : <Eye size={13} />}
            {showPin ? "Hide" : "Show"} PIN
          </button>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: "#FEF2F2" }}>
              <AlertTriangle size={14} color="#B91C1C" />
              <span className="text-sm" style={{ color: "#B91C1C" }}>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setStep("input"); setError(null); }}
              className="flex-1 h-11 rounded-xl border text-sm font-semibold"
              style={{ borderColor: "#E8ECF0", color: "#374151" }}>
              ← Back
            </button>
            <button onClick={handlePinSubmit}
              disabled={loading || pin.join("").length !== 4}
              className="flex-1 h-11 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "#0D7A5F" }}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Verifying…" : "Access Records"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Patient Data View ── */}
      {step === "view" && data && (
        <div>
          {/* Patient header */}
          <div className="card-base p-5 mb-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
              style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
              {(data.profile?.full_name ?? "P").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold" style={{ color: "#1A2332" }}>
                {data.profile?.full_name ?? "Patient"}
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs" style={{ color: "#6B7280" }}>
                {data.patient?.age && <span>{data.patient.age} yrs</span>}
                {data.patient?.gender && <span>{data.patient.gender}</span>}
                {data.patient?.blood_group && <span>Blood: {data.patient.blood_group}</span>}
                {data.profile?.phone && <span>{data.profile.phone}</span>}
              </div>
              {data.patient?.risk_level && (
                <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: data.patient.risk_level === "HIGH" ? "#FEF2F2" : data.patient.risk_level === "MODERATE" ? "#FFFBEB" : "#F0FDF4",
                    color: data.patient.risk_level === "HIGH" ? "#B91C1C" : data.patient.risk_level === "MODERATE" ? "#B45309" : "#15803D",
                  }}>
                  {data.patient.risk_level} RISK
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs" style={{ color: "#9CA3AF" }}>Risk Score</div>
              <div className="text-2xl font-bold" style={{ color: "#1A2332" }}>{data.patient?.risk_score ?? "—"}</div>
            </div>
          </div>

          {/* Security notice */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-5 text-xs font-medium"
            style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
            <ShieldCheck size={14} />
            Secure session active — this access is logged. Patient can revoke at any time.
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-5 bg-white border" style={{ borderColor: "#EEF0F3" }}>
            {[
              { id: "profile" as const, label: "Profile", icon: User },
              { id: "vitals" as const, label: `Vitals (${data.vitals.length})`, icon: Activity },
              { id: "reports" as const, label: `Reports (${data.reports.length})`, icon: FileText },
              { id: "medications" as const, label: `Medications (${data.medications.length})`, icon: Pill },
              { id: "documents" as const, label: `Documents (${Object.values(data.documents ?? {}).flat().length})`, icon: FolderOpen },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: activeTab === id ? "#E8F5F1" : "transparent",
                  color: activeTab === id ? "#0D7A5F" : "#6B7280",
                }}>
                <Icon size={13} /> <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          {/* Profile tab */}
          {activeTab === "profile" && data.patient && (
            <div className="space-y-4">
              <div className="card-base p-5">
                <h3 className="text-sm font-semibold mb-4" style={{ color: "#1A2332" }}>Personal Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <KV label="Full Name" value={data.profile?.full_name} />
                  <KV label="Date of Birth" value={data.patient.dob ? new Date(data.patient.dob).toLocaleDateString("en-IN") : null} />
                  <KV label="Gender" value={data.patient.gender} />
                  <KV label="Blood Group" value={data.patient.blood_group} />
                  <KV label="Height" value={data.patient.height ? `${data.patient.height} cm` : null} />
                  <KV label="Weight" value={data.patient.weight ? `${data.patient.weight} kg` : null} />
                  <KV label="Phone" value={data.profile?.phone} />
                  <KV label="Email" value={data.profile?.email} />
                </div>
              </div>

              {data.patient.conditions?.length > 0 && (
                <div className="card-base p-5">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "#1A2332" }}>Chronic Conditions</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.patient.conditions.map((c) => (
                      <span key={c} className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {data.patient.allergies?.length > 0 && (
                <div className="card-base p-5">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "#1A2332" }}>Allergies</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.patient.allergies.map((a) => (
                      <span key={a} className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "#FEF2F2", color: "#B91C1C" }}>{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {data.patient.emergency_contact && (
                <div className="card-base p-5">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "#1A2332" }}>Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <KV label="Name" value={data.patient.emergency_contact.name} />
                    <KV label="Phone" value={data.patient.emergency_contact.phone} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vitals tab */}
          {activeTab === "vitals" && (
            <div className="card-base overflow-hidden">
              {data.vitals.length === 0 ? (
                <div className="p-12 text-center">
                  <HeartPulse size={28} color="#D1D5DB" className="mx-auto mb-2" />
                  <p className="text-sm" style={{ color: "#9CA3AF" }}>No vitals recorded</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#F7F8FA", borderBottom: "1px solid #EEF0F3" }}>
                      {["Type", "Value", "Unit", "Recorded"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#6B7280" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.vitals.map((v, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td className="px-4 py-3 font-medium capitalize" style={{ color: "#374151" }}>{v.type.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: "#1A2332" }}>{v.value}</td>
                        <td className="px-4 py-3" style={{ color: "#6B7280" }}>{v.unit}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>
                          {new Date(v.recorded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Reports tab */}
          {activeTab === "reports" && (
            <div className="space-y-3">
              {data.reports.length === 0 ? (
                <div className="card-base p-12 text-center">
                  <FileText size={28} color="#D1D5DB" className="mx-auto mb-2" />
                  <p className="text-sm" style={{ color: "#9CA3AF" }}>No reports shared</p>
                </div>
              ) : data.reports.map((r) => (
                <div key={r.id} className="card-base p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>{r.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                        {new Date(r.report_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: r.status === "Flagged" ? "#FEF2F2" : r.status === "Analyzed" ? "#F0FDF4" : "#FFFBEB",
                          color: r.status === "Flagged" ? "#B91C1C" : r.status === "Analyzed" ? "#15803D" : "#B45309",
                        }}>
                        {r.status}
                      </span>
                      {r.file_url && (
                        <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-medium" style={{ color: "#0D7A5F" }}>View File</a>
                      )}
                    </div>
                  </div>
                  {r.ai_summary && (
                    <p className="text-xs leading-relaxed p-3 rounded-lg mb-3" style={{ background: "#F7F8FA", color: "#374151" }}>
                      {r.ai_summary}
                    </p>
                  )}
                  {r.lab_values && r.lab_values.filter((l) => l.status !== "normal").map((l) => (
                    <div key={l.parameter} className="flex items-center justify-between px-3 py-2 rounded-lg mb-1"
                      style={{ background: l.status === "high" ? "#FEF2F2" : "#FFFBEB" }}>
                      <span className="text-xs font-medium" style={{ color: "#374151" }}>{l.parameter}</span>
                      <span className="text-xs font-bold" style={{ color: l.status === "high" ? "#B91C1C" : "#B45309" }}>
                        {l.value} <span className="font-normal" style={{ color: "#9CA3AF" }}>({l.range})</span>
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Medications tab */}
          {activeTab === "medications" && (
            <div className="space-y-2">
              {data.medications.length === 0 ? (
                <div className="card-base p-12 text-center">
                  <Pill size={28} color="#D1D5DB" className="mx-auto mb-2" />
                  <p className="text-sm" style={{ color: "#9CA3AF" }}>No active medications</p>
                </div>
              ) : data.medications.map((m, i) => (
                <div key={i} className="card-base p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#E8F5F1" }}>
                    <Pill size={16} color="#0D7A5F" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: "#1A2332" }}>
                      {m.name} <span style={{ color: "#6B7280", fontWeight: 400 }}>({m.quantity ?? 1} {m.unit ?? "tablet"})</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                      {m.dose} · {m.frequency}{m.times?.length ? ` · ${m.times.join(", ")}` : ""}
                    </div>
                  </div>
                  {m.streak > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#E8F5F1", color: "#0D7A5F" }}>
                      🔥 {m.streak}d
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Documents tab */}
          {activeTab === "documents" && (() => {
            const allDocs = Object.values(data.documents ?? {}).flat();
            const catLabels: Record<string, string> = {
              "lab-reports": "Lab Reports", prescriptions: "Prescriptions",
              scans: "Scans & Imaging", insurance: "Insurance & ID",
            };
            return allDocs.length === 0 ? (
              <div className="card-base p-12 text-center">
                <FolderOpen size={28} color="#D1D5DB" className="mx-auto mb-2" />
                <p className="text-sm" style={{ color: "#9CA3AF" }}>No documents uploaded by patient</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(data.documents ?? {}).map(([cat, files]) => {
                  if (!files.length) return null;
                  return (
                    <div key={cat} className="card-base p-4">
                      <h3 className="text-sm font-semibold mb-3" style={{ color: "#1A2332" }}>{catLabels[cat] ?? cat}</h3>
                      <div className="space-y-2">
                        {files.map((f) => (
                          <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors hover:border-[#0D7A5F] hover:bg-[#E8F5F1]"
                            style={{ borderColor: "#E8ECF0" }}>
                            <FileText size={15} color="#0D7A5F" className="shrink-0" />
                            <span className="flex-1 text-sm truncate" style={{ color: "#374151" }}>{f.name}</span>
                            <ExternalLink size={13} color="#9CA3AF" className="shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#9CA3AF" }}>{label}</div>
      <div className="text-sm font-medium" style={{ color: value ? "#1A2332" : "#D1D5DB" }}>{value ?? "—"}</div>
    </div>
  );
}
