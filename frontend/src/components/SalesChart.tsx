import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";

const data = [
  { month: "Jan", sales: 3500 },
  { month: "Feb", sales: 5200 },
  { month: "Mar", sales: 4800 },
  { month: "Apr", sales: 7100 },
  { month: "May", sales: 6200 },
  { month: "Jun", sales: 5500 },
  { month: "Jul", sales: 3200 },
  { month: "Aug", sales: 7500 },
  { month: "Sep", sales: 6800 },
  { month: "Oct", sales: 8200 },
  { month: "Nov", sales: 7200 },
  { month: "Dec", sales: 6500 },
];

export function SalesChart() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">Sales Analytics</h3>
        <div className="flex gap-2">
          <Button
            variant={period === "daily" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPeriod("daily")}
            className="text-sm"
          >
            Daily
          </Button>
          <Button
            variant={period === "weekly" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPeriod("weekly")}
            className="text-sm"
          >
            Weekly
          </Button>
          <Button
            variant={period === "monthly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriod("monthly")}
            className="text-sm"
          >
            Monthly
          </Button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--muted))' }}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Bar 
            dataKey="sales" 
            fill="url(#barGradient)"
            radius={[8, 8, 0, 0]}
          />
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-yellow))" />
              <stop offset="100%" stopColor="hsl(var(--chart-yellow))" stopOpacity={0.6} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
