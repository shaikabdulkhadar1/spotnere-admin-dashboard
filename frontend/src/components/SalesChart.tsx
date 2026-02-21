import { useState, useEffect } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface SalesDataPoint {
  label: string;
  sales: number;
  count: number;
}

export function SalesChart() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [data, setData] = useState<SalesDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setIsLoading(true);
        const accessToken = localStorage.getItem("access_token");
        const response = await fetch(
          `${API_URL}/api/bookings/sales-analytics?period=${period}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (response.ok) {
          const result = await response.json();
          setData(Array.isArray(result) ? result : []);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching sales analytics:", error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSalesData();
  }, [period]);

  const chartData = data.map((d) => ({
    month: d.label,
    sales: d.sales,
  }));

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-9">
        <div>
          <h3 className="font-semibold text-lg">Sales Analytics</h3>
          <p className="text-xs text-muted-foreground">
            Sales data for the selected period
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPeriod("daily")}
            className={`text-sm ${period === "daily" ? "bg-black text-white hover:bg-black/90 hover:text-white" : ""}`}
          >
            Daily
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPeriod("weekly")}
            className={`text-sm ${period === "weekly" ? "bg-black text-white hover:bg-black/90 hover:text-white" : ""}`}
          >
            Weekly
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPeriod("monthly")}
            className={`text-sm ${period === "monthly" ? "bg-black text-white hover:bg-black/90 hover:text-white" : ""}`}
          >
            Monthly
          </Button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {isLoading ? (
          <Skeleton className="w-full h-[300px] rounded-lg" />
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted-foreground) / 0.2)"
              horizontal={true}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) =>
                `₹${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`
              }
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [
                `₹${Number(value).toLocaleString("en-IN")}`,
                "Sales",
              ]}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--chart-yellow))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-yellow))", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(var(--background))" }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
