"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Pie, PieChart, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SEGMENT_COLORS: Record<string, string> = {
  "New Customers": "hsl(var(--chart-yellow))",
  "VIP Customers": "hsl(var(--chart-green))",
  "Regular Customers": "hsl(var(--chart-red))",
  "Inactive Customers": "hsl(var(--accent))",
};

const chartConfig = {
  visitors: {
    label: "Customers",
  },
  new: {
    label: "New Customers",
    color: "hsl(var(--chart-yellow))",
  },
  vip: {
    label: "VIP Customers",
    color: "hsl(var(--chart-green))",
  },
  regular: {
    label: "Regular Customers",
    color: "hsl(var(--chart-red))",
  },
  inactive: {
    label: "Inactive Customers",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

interface DistributionSegment {
  segment: string;
  count: number;
}

export function CustomerInsights() {
  const [chartData, setChartData] = useState<
    { browser: string; visitors: number; fill: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDistribution = async () => {
      try {
        setIsLoading(true);
        const accessToken = localStorage.getItem("access_token");
        const response = await fetch(
          `${API_URL}/api/users/customer-distribution`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (response.ok) {
          const result: DistributionSegment[] = await response.json();
          const segments = Array.isArray(result) ? result : [];
          setChartData(
            segments.map((item) => ({
              browser: item.segment,
              visitors: item.count ?? 0,
              fill:
                SEGMENT_COLORS[item.segment] || "hsl(var(--muted-foreground))",
            })),
          );
        } else {
          const errBody = await response.json().catch(() => ({}));
          console.warn(
            "Customer distribution fetch failed:",
            response.status,
            errBody,
          );
          setChartData([]);
        }
      } catch (error) {
        console.error("Error fetching customer distribution:", error);
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDistribution();
  }, []);

  const total = chartData.reduce((sum, item) => sum + item.visitors, 0);

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="mb-2">
        <h3 className="font-semibold text-lg mb-1">Customer Distribution</h3>
        <p className="text-xs text-muted-foreground">
          Total: {total.toLocaleString()} customers
        </p>
      </div>
      <ChartContainer
        config={chartConfig}
        className="mx-auto w-full min-h-[200px] aspect-square max-h-[300px]"
      >
        {isLoading ? (
          <Skeleton className="w-full aspect-square max-h-[300px] rounded-lg" />
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center aspect-square max-h-[300px] text-muted-foreground text-sm">
            No customer data yet
          </div>
        ) : (
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  hideIndicator
                  formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums">
                      {typeof value === "number"
                        ? value.toLocaleString()
                        : value}
                    </span>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={50}
              outerRadius={100}
              paddingAngle={3}
              cornerRadius={12}
              strokeWidth={10}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        )}
      </ChartContainer>
      {!isLoading && chartData.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
          {chartData.map((entry) => (
            <div key={entry.browser} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: entry.fill }}
              />
              <span className="text-muted-foreground">{entry.browser}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
