"use client";

import * as React from "react";
import { Pie, PieChart, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { browser: "New Customers", visitors: 35, fill: "hsl(var(--chart-yellow))" },
  { browser: "VIP Customers", visitors: 15, fill: "hsl(var(--chart-green))" },
  {
    browser: "Regular Customers",
    visitors: 20,
    fill: "hsl(var(--chart-red))",
  },
  { browser: "Inactive Customers", visitors: 30, fill: "hsl(var(--accent))" },
];

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

export function CustomerInsights() {
  const total = chartData.reduce((sum, item) => sum + item.visitors, 0);

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-1">Customer Distribution</h3>
        <p className="text-xs text-muted-foreground">
          Total: {total.toLocaleString()} customers
        </p>
      </div>
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[300px]"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
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
      </ChartContainer>
    </div>
  );
}
