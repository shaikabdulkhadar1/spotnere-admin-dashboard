import {
  LayoutDashboard,
  MapPin,
  UserCog,
  Users,
  Star,
  Percent,
  BarChart3,
  Settings,
  Wallet,
  Calendar,
} from "lucide-react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    count: null,
    description: "Overview of the platform",
  },
  {
    title: "Listings",
    url: "/listings",
    icon: MapPin,
    count: 24,
    description: "View all listings",
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
    count: null,
    description: "View all customers",
  },
  {
    title: "Bookings",
    url: "/bookings",
    icon: Calendar,
    count: null,
    description: "View all bookings",
  },
  {
    title: "Reviews",
    url: "/reviews",
    icon: Star,
    count: 14,
    description: "View all reviews",
  },
  {
    title: "Promotions",
    url: "/promotions",
    icon: Percent,
    count: null,
    description: "View all promotions",
  },
  {
    title: "Payouts",
    url: "/payouts",
    icon: Wallet,
    count: null,
    description: "Manage payouts",
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    count: null,
    description: "View all analytics",
  },
  {
    title: "Administration",
    url: "/administration",
    icon: UserCog,
    count: null,
    description: "View all administration",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    count: null,
    description: "View all settings",
  },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <aside
      className="fixed p-2 w-64 h-[95vh] flex flex-col rounded-lg overflow-hidden z-40 shadow-lg"
      style={{
        background:
          "linear-gradient(to right, hsl(340 30% 98%) 0%, hsl(0 0% 100%) 100%)",
      }}
    >
      {/* Logo and title */}
      <div className="p-6 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Spotnere"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="font-bold text-2xl">Spotnere</h2>
            <p className="text-sm text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.url ||
            location.pathname.startsWith(item.url + "/");
          return (
            <RouterNavLink
              key={item.url}
              to={item.url}
              end={item.url === "/dashboard"}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-black text-white"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-transform hover:scale-110",
                  isActive ? "text-white" : "text-gray-900",
                )}
              />
              <div className="flex flex-col">
                <span
                  className={cn(
                    "flex-1 text-black",
                    isActive ? "text-white" : "",
                  )}
                >
                  {item.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              </div>
            </RouterNavLink>
          );
        })}
      </nav>
    </aside>
  );
}
