import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea,
  ResponsiveContainer, Legend
} from "recharts";

// HSE / Irish laboratory reference ranges
export const LAB_RANGES = {
  haemoglobin: { label: "Haemoglobin", unit: "g/L", low: 120, high: 170, critical_low: 80, critical_high: 200 },
  wcc: { label: "White Cell Count", unit: "x10⁹/L", low: 4, high: 11, critical_low: 2, critical_high: 30 },
  platelets: { label: "Platelets", unit: "x10⁹/L", low: 150, high: 400, critical_low: 50, critical_high: 600 },
  sodium: { label: "Sodium", unit: "mmol/L", low: 135, high: 145, critical_low: 125, critical_high: 155 },
  potassium: { label: "Potassium", unit: "mmol/L", low: 3.5, high: 5.1, critical_low: 2.5, critical_high: 6.5 },
  urea: { label: "Urea", unit: "mmol/L", low: 2.5, high: 7.8, critical_low: 1, critical_high: 20 },
  creatinine: { label: "Creatinine", unit: "µmol/L", low: 60, high: 110, critical_low: 30, critical_high: 400 },
  crp: { label: "CRP", unit: "mg/L", low: 0, high: 5, critical_low: 0, critical_high: 200 },
  egfr: { label: "eGFR", unit: "mL/min", low: 90, high: 120, critical_low: 15, critical_high: 120 },
  bilirubin: { label: "Bilirubin", unit: "µmol/L", low: 3, high: 21, critical_low: 0, critical_high: 100 },
  alt: { label: "ALT", unit: "IU/L", low: 10, high: 40, critical_low: 0, critical_high: 500 },
  albumin: { label: "Albumin", unit: "g/L", low: 35, high: 50, critical_low: 20, critical_high: 55 },
  inr: { label: "INR", unit: "", low: 0.8, high: 1.2, critical_low: 0.5, critical_high: 5 },
};

export function getAbnormalStatus(testType, value) {
  const range = LAB_RANGES[testType];
  if (!range || value == null) return "normal";
  if (value <= range.critical_low || value >= range.critical_high) return "critical";
  if (value < range.low || value > range.high) return "warning";
  return "normal";
}

export default function BloodTrendChart({ testType, data }) {
  const range = LAB_RANGES[testType];
  if (!range || !data || data.length === 0) return null;

  const chartData = [...data]
    .sort((a, b) => new Date(a.collected_at) - new Date(b.collected_at))
    .map(d => ({
      ...d,
      label: new Date(d.collected_at).toLocaleDateString("en-IE", { day: "2-digit", month: "short" }),
    }));

  const values = chartData.map(d => d.value);
  const minVal = Math.min(...values, range.critical_low);
  const maxVal = Math.max(...values, range.critical_high);
  const padding = (maxVal - minVal) * 0.1;
  const yMin = Math.max(0, minVal - padding);
  const yMax = maxVal + padding;

  const latest = chartData[chartData.length - 1];
  const latestStatus = getAbnormalStatus(testType, latest.value);

  const statusColor = {
    critical: "#ef4444",
    warning: "#f59e0b",
    normal: "#22c55e",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{range.label}</h4>
          <p className="text-[10px] text-muted-foreground">
            Ref: {range.low}–{range.high} {range.unit}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold" style={{ color: statusColor[latestStatus] }}>
              {latest.value}
            </span>
            <span className="text-[10px] text-muted-foreground">{range.unit}</span>
          </div>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: `${statusColor[latestStatus]}20`,
              color: statusColor[latestStatus],
            }}
          >
            {latestStatus === "critical" ? "CRITICAL" : latestStatus === "warning" ? "ABNORMAL" : "NORMAL"}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
          <defs>
            <linearGradient id={`grad-${testType}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 30% 18%)" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(215 20% 60%)" }} stroke="hsl(220 30% 18%)" />
          <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10, fill: "hsl(215 20% 60%)" }} stroke="hsl(220 30% 18%)" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(220 44% 12%)",
              border: "1px solid hsl(220 30% 18%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "hsl(210 40% 98%)" }}
            formatter={(v) => [`${v} ${range.unit}`, range.label]}
          />
          {/* Normal range band (green) */}
          <ReferenceArea y1={range.low} y2={range.high} fill="#22c55e" fillOpacity={0.08} />
          {/* Critical zones (red) */}
          <ReferenceArea y1={yMin} y2={range.critical_low} fill="#ef4444" fillOpacity={0.06} />
          <ReferenceArea y1={range.critical_high} y2={yMax} fill="#ef4444" fillOpacity={0.06} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#f9d342"
            strokeWidth={2}
            dot={{ fill: "#f9d342", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}