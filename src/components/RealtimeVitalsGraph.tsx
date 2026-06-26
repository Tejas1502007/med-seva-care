import { useEffect, useRef, useState } from "react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { supabase } from "@/lib/supabase";
import { RefreshCw, Activity } from "lucide-react";

interface VitalReading {
  timestamp: string;
  sugar?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
}

interface RealtimeVitalsGraphProps {
  userId: string;
  view: "sugar" | "bp";
  hoursToShow?: number;
}

export function RealtimeVitalsGraph({ userId, view, hoursToShow = 24 }: RealtimeVitalsGraphProps) {
  const [data, setData] = useState<VitalReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch historical vitals for the past N hours
  const fetchHistoricalData = async () => {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hoursToShow);

    const { data: vitals, error } = await supabase
      .from("vitals")
      .select("type, value, unit, notes, recorded_at")
      .eq("patient_id", userId)
      .gte("recorded_at", hoursAgo.toISOString())
      .order("recorded_at", { ascending: true });

    if (error) {
      console.error("Error fetching vitals:", error);
      return;
    }

    processVitalsData(vitals || []);
  };

  // Transform raw vitals into chart data
  const processVitalsData = (vitals: any[]) => {
    const dataMap = new Map<string, VitalReading>();

    vitals.forEach((v) => {
      const timestamp = new Date(v.recorded_at).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (!dataMap.has(timestamp)) {
        dataMap.set(timestamp, { timestamp });
      }

      const reading = dataMap.get(timestamp)!;

      if (v.type === "blood_sugar") {
        reading.sugar = Number(v.value);
      } else if (v.type === "blood_pressure") {
        reading.bpSystolic = Number(v.value);
        // Extract diastolic from notes if available
        const diastolic = v.notes?.match(/Diastolic:\s*(\d+)/)?.[1];
        if (diastolic) {
          reading.bpDiastolic = Number(diastolic);
        }
      }
    });

    setData(Array.from(dataMap.values()));
    setLoading(false);
  };

  // Subscribe to real-time vitals updates
  useEffect(() => {
    const subscribe = async () => {
      await fetchHistoricalData();

      if (!isLive) return;

      channelRef.current = supabase
        .channel(`vitals:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "vitals",
            filter: `patient_id=eq.${userId}`,
          },
          (payload) => {
            const vital = payload.new;
            const timestamp = new Date(vital.recorded_at).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            });

            setData((prev) => {
              const updated = [...prev];
              const existing = updated.find((d) => d.timestamp === timestamp);

              if (existing) {
                if (vital.type === "blood_sugar") {
                  existing.sugar = Number(vital.value);
                } else if (vital.type === "blood_pressure") {
                  existing.bpSystolic = Number(vital.value);
                  const diastolic = vital.notes?.match(/Diastolic:\s*(\d+)/)?.[1];
                  if (diastolic) {
                    existing.bpDiastolic = Number(diastolic);
                  }
                }
              } else {
                const newReading: VitalReading = { timestamp };
                if (vital.type === "blood_sugar") {
                  newReading.sugar = Number(vital.value);
                } else if (vital.type === "blood_pressure") {
                  newReading.bpSystolic = Number(vital.value);
                  const diastolic = vital.notes?.match(/Diastolic:\s*(\d+)/)?.[1];
                  if (diastolic) {
                    newReading.bpDiastolic = Number(diastolic);
                  }
                }
                updated.push(newReading);
              }

              // Keep only last 48 data points for performance
              return updated.slice(-48);
            });
          }
        )
        .subscribe();
    };

    subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId, isLive]);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchHistoricalData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-400">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin">⚡</div>
          <p className="text-sm">Loading real-time data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} color="#0D7A5F" />
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isLive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
            {isLive ? "🔴 LIVE" : "Paused"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 transition"
          >
            {isLive ? "Pause" : "Resume"}
          </button>
          <button
            onClick={handleRefresh}
            className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 transition flex items-center gap-1"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ height: 300 }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {view === "sugar" ? (
              <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="sugarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} label={{ value: "mg/dL", angle: -90, position: "insideLeft" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #E8ECF0", fontSize: 12 }}
                  formatter={(value) => [`${value} mg/dL`, "Blood Sugar"]}
                />
                <Area
                  type="monotone"
                  dataKey="sugar"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  fill="url(#sugarGradient)"
                  connectNulls
                  dot={{ fill: "#EF4444", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            ) : (
              <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} label={{ value: "mmHg", angle: -90, position: "insideLeft" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #E8ECF0", fontSize: 12 }}
                  formatter={(value) => [`${value} mmHg`, "BP"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bpSystolic"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={{ fill: "#3B82F6", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Systolic"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="bpDiastolic"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ fill: "#8B5CF6", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Diastolic"
                  connectNulls
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <Activity size={24} />
            <p className="text-sm">No real-time data yet</p>
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-500 flex justify-between">
        <span>Last 24 hours</span>
        <span>{data.length} readings</span>
      </div>
    </div>
  );
}
