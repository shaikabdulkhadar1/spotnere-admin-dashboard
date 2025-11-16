import { motion } from "framer-motion";
import { StatCard } from "@/components/StatCard";
import { ActionCard } from "@/components/ActionCard";
import { CustomerInsights } from "@/components/CustomerInsights";
import { SalesChart } from "@/components/SalesChart";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Percent,
  Eye,
  Tag,
  Mail,
  Megaphone,
  Gift,
  Plus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

const promotions = [
  { name: "Holiday Sale", code: "234 used", status: "Active" as const },
  {
    name: "New Customer Welcome",
    campaign: "89% open rate",
    status: "Running" as const,
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>
        <Button className="bg-black text-white hover:bg-gray-900 rounded-lg gap-2 mt-1">
          <Plus className="w-4 h-4" />
          New Order
        </Button>
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
