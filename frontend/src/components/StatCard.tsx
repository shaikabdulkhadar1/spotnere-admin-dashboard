import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend = "neutral",
}: StatCardProps) {
  const trendColor = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-muted-foreground",
  };

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-card rounded-xl border border-border p-6 "
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>

      <h3 className="text-3xl font-bold mb-2">{value}</h3>

      {change && (
        <div className="flex items-center gap-1">
          {TrendIcon && (
            <TrendIcon className={`w-3 h-3 ${trendColor[trend]}`} />
          )}
          <p className={`text-sm ${trendColor[trend]}`}>{change}</p>
        </div>
      )}
    </motion.div>
  );
}
