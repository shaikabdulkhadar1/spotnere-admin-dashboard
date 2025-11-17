import { motion } from "framer-motion";
import { useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { ActionCard } from "@/components/ActionCard";
import { CustomerInsights } from "@/components/CustomerInsights";
import { SalesChart } from "@/components/SalesChart";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

const stats = [
  {
    title: "Total Sales",
    value: "$54,890",
    change: "+12.5% This month",
    trend: "up" as const,
    icon: DollarSign,
  },
  {
    title: "Orders",
    value: "1,429",
    change: "+8.2% This month",
    trend: "up" as const,
    icon: ShoppingCart,
  },
  {
    title: "Average Order Value",
    value: "$38.42",
    change: "+3.1% This month",
    trend: "up" as const,
    icon: TrendingUp,
  },
  {
    title: "Customer Insights",
    value: "2,847",
    change: "+2.4% This month",
    trend: "up" as const,
    icon: Users,
  },
];

export default function Dashboard() {
  const { admin, isLoading, refreshAdmin } = useAdmin();

  // Ensure admin data is fetched when dashboard loads
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (isAuthenticated && !isLoading && !admin) {
      // If authenticated but no admin data, trigger a refresh
      refreshAdmin();
    }
  }, [admin, isLoading, refreshAdmin]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>
      </div>

      {/* Data Overview Cards - 4 cards in one row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Chart */}
          <SalesChart />
        </div>

        {/* Sidebar - Customer Insights & Promotions */}
        <div className="space-y-6">
          <CustomerInsights />
        </div>
      </div>
    </div>
  );
}
