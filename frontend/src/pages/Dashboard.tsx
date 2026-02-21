import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { CustomerInsights } from "@/components/CustomerInsights";
import { SalesChart } from "@/components/SalesChart";
import { MapPinned, MapPinHouse, Users, Star } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Dashboard() {
  const { admin, isLoading, refreshAdmin } = useAdmin();
  const [placesCount, setPlacesCount] = useState<number | null>(null);
  const [isLoadingPlacesCount, setIsLoadingPlacesCount] = useState(true);
  const [countriesCount, setCountriesCount] = useState<number | null>(null);
  const [isLoadingCountriesCount, setIsLoadingCountriesCount] = useState(true);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [isLoadingUsersCount, setIsLoadingUsersCount] = useState(true);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [isLoadingAverageRating, setIsLoadingAverageRating] = useState(true);

  // Ensure admin data is fetched when dashboard loads
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (isAuthenticated && !isLoading && !admin) {
      // If authenticated but no admin data, trigger a refresh
      refreshAdmin();
    }
  }, [admin, isLoading, refreshAdmin]);

  // Fetch places count
  useEffect(() => {
    const fetchPlacesCount = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        const url = `${API_URL}/api/places/count`;
        console.log("Fetching places count from:", url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Places count response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Places count data:", data);
          setPlacesCount(data.count);
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
          console.error(
            "Failed to fetch places count:",
            response.status,
            errorData
          );
        }
      } catch (error) {
        console.error("Error fetching places count:", error);
      } finally {
        setIsLoadingPlacesCount(false);
      }
    };

    fetchPlacesCount();
  }, []);

  // Fetch countries count
  useEffect(() => {
    const fetchCountriesCount = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        const url = `${API_URL}/api/places/countries/count`;
        console.log("Fetching countries count from:", url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Countries count response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Countries count data:", data);
          setCountriesCount(data.count);
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
          console.error(
            "Failed to fetch countries count:",
            response.status,
            errorData
          );
        }
      } catch (error) {
        console.error("Error fetching countries count:", error);
      } finally {
        setIsLoadingCountriesCount(false);
      }
    };

    fetchCountriesCount();
  }, []);

  // Fetch users count
  useEffect(() => {
    const fetchUsersCount = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        const url = `${API_URL}/api/users/count`;
        console.log("Fetching users count from:", url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Users count response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Users count data:", data);
          setUsersCount(data.count);
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
          console.error(
            "Failed to fetch users count:",
            response.status,
            errorData
          );
        }
      } catch (error) {
        console.error("Error fetching users count:", error);
      } finally {
        setIsLoadingUsersCount(false);
      }
    };

    fetchUsersCount();
  }, []);

  // Fetch average rating
  useEffect(() => {
    const fetchAverageRating = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        const url = `${API_URL}/api/places/rating/average`;
        console.log("Fetching average rating from:", url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Average rating response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Average rating data:", data);
          setAverageRating(data.average);
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
          console.error(
            "Failed to fetch average rating:",
            response.status,
            errorData
          );
        }
      } catch (error) {
        console.error("Error fetching average rating:", error);
      } finally {
        setIsLoadingAverageRating(false);
      }
    };

    fetchAverageRating();
  }, []);

  // Stats array with dynamic places count
  const stats = [
    {
      title: "Total Venues",
      description: "all over the world",
      value: placesCount?.toLocaleString() || "0",
      change: "+12.5% This month",
      trend: "up" as const,
      icon: MapPinned,
      isLoading: isLoadingPlacesCount,
      href: "/listings",
    },
    {
      title: "Total Countries",
      description: "we are in",
      value: countriesCount?.toLocaleString() || "0",
      change: "+8.2% This month",
      trend: "up" as const,
      icon: MapPinHouse,
      isLoading: isLoadingCountriesCount,
      href: "/listings",
    },
    {
      title: "Total Customers",
      description: "all over the world",
      value: usersCount?.toLocaleString() || "0",
      change: "+3.1% This month",
      trend: "up" as const,
      icon: Users,
      isLoading: isLoadingUsersCount,
      href: "/customers",
    },
    {
      title: "Average Rating",
      description: "all over the world",
      value: averageRating?.toFixed(1) || "0.0",
      change: "+2.4% This month",
      trend: "up" as const,
      icon: Star,
      isLoading: isLoadingAverageRating,
      href: "/reviews",
    },
  ];

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
        <div className="space-y-4">
          <CustomerInsights />
        </div>
      </div>
    </div>
  );
}
