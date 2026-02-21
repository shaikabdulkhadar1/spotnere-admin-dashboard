import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  Calendar,
  Star,
  TrendingUp,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { SalesChart } from "@/components/SalesChart";
import { CustomerInsights } from "@/components/CustomerInsights";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface SalesDataPoint {
  label: string;
  sales: number;
  count: number;
}

interface PayoutRow {
  place_id: string;
  place_name: string;
  num_bookings: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Analytics() {
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [placesCount, setPlacesCount] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const accessToken = localStorage.getItem("access_token");
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };

      const [salesRes, payoutsRes, placesRes, usersRes, ratingRes] =
        await Promise.all([
          fetch(`${API_URL}/api/bookings/sales-analytics?period=monthly`, {
            headers,
          }),
          fetch(`${API_URL}/api/payouts`, { headers }),
          fetch(`${API_URL}/api/places/count`, { headers }),
          fetch(`${API_URL}/api/users/count`, { headers }),
          fetch(`${API_URL}/api/places/rating/average`, { headers }),
        ]);

      if (salesRes.ok) {
        const data = await salesRes.json();
        setSalesData(Array.isArray(data) ? data : []);
      }
      if (payoutsRes.ok) {
        const data = await payoutsRes.json();
        setPayouts(Array.isArray(data) ? data : []);
      }
      if (placesRes.ok) {
        const data = await placesRes.json();
        setPlacesCount(data?.count ?? null);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsersCount(data?.count ?? null);
      }
      if (ratingRes.ok) {
        const data = await ratingRes.json();
        setAvgRating(data?.average ?? null);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = salesData.reduce((sum, d) => sum + (d.sales || 0), 0);
    const totalBookings = salesData.reduce((sum, d) => sum + (d.count || 0), 0);
    const totalPaid = payouts.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    const totalPending = payouts.reduce((sum, p) => sum + (p.balance || 0), 0);

    return {
      totalRevenue,
      totalBookings,
      totalPaid,
      totalPending,
      placesCount: placesCount ?? 0,
      usersCount: usersCount ?? 0,
      avgRating: avgRating ?? 0,
    };
  }, [salesData, payouts, placesCount, usersCount, avgRating]);

  const topVenuesByBookings = useMemo(() => {
    return [...payouts]
      .sort((a, b) => (b.num_bookings || 0) - (a.num_bookings || 0))
      .slice(0, 5);
  }, [payouts]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Business insights and performance metrics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAllData}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                From bookings (last 12 months)
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Bookings
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">
                  {stats.totalBookings.toLocaleString()}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Across all venues
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Rating
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Across all venues
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payouts
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalPending)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                To be paid to vendors
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div>
          <CustomerInsights />
        </div>
      </div>

      {/* Bottom Row: Top Venues + Payout Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Venues by Bookings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Venues by Bookings
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Venues with the most bookings
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topVenuesByBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No booking data yet
              </p>
            ) : (
              <div className="space-y-3">
                {topVenuesByBookings.map((row, idx) => (
                  <div
                    key={row.place_id || idx}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium">{row.place_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.num_bookings} bookings ·{" "}
                          {formatCurrency(row.total_amount)} revenue
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout Summary */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Payout Summary
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Vendor payouts overview
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Paid
                    </p>
                    <p className="text-xl font-bold">
                      {formatCurrency(stats.totalPaid)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Pending Balance
                    </p>
                    <p className="text-xl font-bold">
                      {formatCurrency(stats.totalPending)}
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {payouts.length} vendor(s) with payout data
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
