import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAdmin } from "@/contexts/AdminContext";

export function AdminTopbar() {
  const { admin, isLoading } = useAdmin();

  // Get admin name or fallback
  const adminName = admin
    ? `${admin.first_name || ""} ${admin.last_name || ""}`.trim() || "Admin"
    : "Admin";

  // Get role from admin context
  const adminRole = admin?.role || "Store Manager";

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!admin) return "A";
    const first = admin.first_name?.[0] || "";
    const last = admin.last_name?.[0] || "";
    return (first + last).toUpperCase() || "A";
  };
  return (
    <header className="fixed top-0 right-0 left-64 z-30 bg-[#F4F5F5]">
      <div className="flex items-center justify-end px-6 py-4">
        {/* Right side: Notifications and User Profile */}
        <div className="flex items-center gap-4 ml-4">
          {/* Bell with yellow badge */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-14 w-14 hover:bg-primary/10 hover:text-primary transition-all border border-[#FFFFFF] bg-[#FFFFFF] rounded-full shadow-lg"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-semibold text-gray-900">3</span>
            </span>
          </Button>

          {/* User Profile - No dropdown, just display */}
          <div className="flex items-center gap-3 border border-[#FFFFFF] bg-[#FFFFFF] rounded-full h-14 p-6 shadow-lg">
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${
                  admin?.email || "admin"
                }`}
                alt={adminName}
              />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-foreground">
                {isLoading ? "Loading..." : adminName}
              </p>
              <p className="text-xs text-muted-foreground">
                {isLoading ? "Loading..." : adminRole}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
