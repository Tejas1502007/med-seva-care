export function MedSevaLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const scale = size === "lg" ? 1.6 : size === "sm" ? 0.85 : 1;
  return (
    <div className="flex items-center gap-2.5">
      <svg width={32 * scale} height={32 * scale} viewBox="0 0 32 32" fill="none">
        <path
          d="M16 4C12 4 9 7 9 11c0 3 2 5 4 6-2 1-4 3-4 6 0 4 3 7 7 7s7-3 7-7c0-3-2-5-4-6 2-1 4-3 4-6 0-4-3-7-7-7z"
          fill="#0D7A5F"
          opacity="0.18"
        />
        <path
          d="M6 17h4l1.5-3 3 6 2.5-4h9"
          stroke="#0D7A5F"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <div className="flex flex-col leading-tight">
        <span
          className="font-bold tracking-tight"
          style={{ fontSize: 18 * scale, color: "#1A2332" }}
        >
          MedSeva
        </span>
        {size !== "sm" && (
          <span style={{ fontSize: 11, color: "#6B7280" }}>Continuous Care</span>
        )}
      </div>
    </div>
  );
}
