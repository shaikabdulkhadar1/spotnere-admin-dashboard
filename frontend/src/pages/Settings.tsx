import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Key,
  Bell,
  Globe,
  LayoutDashboard,
  Building2,
  Calendar,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { useToast } from "@/hooks/use-toast";

const SETTINGS_KEYS = {
  emailNotifications: "spotnere_settings_email_notifications",
  soundEnabled: "spotnere_settings_sound_enabled",
  compactSidebar: "spotnere_settings_compact_sidebar",
} as const;

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}) {
  const display = value?.trim() || "—";
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-all">{display}</p>
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin, isLoading, refreshAdmin } = useAdmin();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [compactSidebar, setCompactSidebar] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    setEmailNotifications(
      localStorage.getItem(SETTINGS_KEYS.emailNotifications) !== "false",
    );
    setSoundEnabled(
      localStorage.getItem(SETTINGS_KEYS.soundEnabled) !== "false",
    );
    setCompactSidebar(
      localStorage.getItem(SETTINGS_KEYS.compactSidebar) === "true",
    );
  }, []);

  const handleEmailNotificationsChange = (checked: boolean) => {
    setEmailNotifications(checked);
    localStorage.setItem(SETTINGS_KEYS.emailNotifications, String(checked));
    toast({
      title: "Settings updated",
      description: checked
        ? "Email notifications enabled"
        : "Email notifications disabled",
    });
  };

  const handleSoundEnabledChange = (checked: boolean) => {
    setSoundEnabled(checked);
    localStorage.setItem(SETTINGS_KEYS.soundEnabled, String(checked));
    toast({
      title: "Settings updated",
      description: checked
        ? "Sound notifications enabled"
        : "Sound notifications disabled",
    });
  };

  const handleCompactSidebarChange = (checked: boolean) => {
    setCompactSidebar(checked);
    localStorage.setItem(SETTINGS_KEYS.compactSidebar, String(checked));
    toast({
      title: "Settings updated",
      description: checked
        ? "Compact sidebar enabled"
        : "Compact sidebar disabled",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });

    navigate("/", { replace: true });
  };

  const displayName =
    `${admin?.first_name || ""} ${admin?.last_name || ""}`.trim() || "—";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your account and preferences
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refreshAdmin()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast({
                title: "Edit profile",
                description: "Edit profile functionality coming soon.",
              })
            }
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit profile
          </Button>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Card - 2 column layout for details */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>
              All your details from the admins table
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </div>
            ) : admin ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.email || "admin"}`}
                      alt={displayName}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-lg">
                      {(admin.first_name?.[0] || "") +
                        (admin.last_name?.[0] || "") || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{displayName}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {admin.role || "Admin"}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                  <div className="md:col-span-2">
                    <InfoRow icon={Key} label="User ID" value={admin.id} />
                  </div>
                  <InfoRow
                    icon={User}
                    label="First name"
                    value={admin.first_name}
                  />
                  <InfoRow
                    icon={User}
                    label="Last name"
                    value={admin.last_name}
                  />
                  <InfoRow icon={Mail} label="Email" value={admin.email} />
                  <InfoRow
                    icon={Phone}
                    label="Phone"
                    value={admin.phone_number}
                  />
                  <InfoRow icon={Shield} label="Role" value={admin.role} />
                  <div className="md:col-span-2">
                    <InfoRow
                      icon={MapPin}
                      label="Address"
                      value={admin.address}
                    />
                  </div>
                  <InfoRow icon={Building2} label="City" value={admin.city} />
                  <InfoRow icon={Building2} label="State" value={admin.state} />
                  <InfoRow
                    icon={MapPin}
                    label="Country"
                    value={admin.country}
                  />
                  <InfoRow
                    icon={MapPin}
                    label="Postal code"
                    value={admin.postal_code}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Created at"
                    value={
                      admin.created_at
                        ? new Date(admin.created_at).toLocaleString()
                        : undefined
                    }
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Updated at"
                    value={
                      admin.updated_at
                        ? new Date(admin.updated_at).toLocaleString()
                        : undefined
                    }
                  />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center">
                No profile data available. Please log in again.
              </p>
            )}
          </CardContent>
        </Card>

        {/* General Settings Card - below profile */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General
            </CardTitle>
            <CardDescription>
              Website preferences and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="email-notifications" className="cursor-pointer">
                  Email notifications
                </Label>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={handleEmailNotificationsChange}
              />
            </div>
            <p className="text-xs text-muted-foreground -mt-4">
              Receive email updates for important events
            </p>

            <Separator />

            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="sound-enabled" className="cursor-pointer">
                  Sound notifications
                </Label>
              </div>
              <Switch
                id="sound-enabled"
                checked={soundEnabled}
                onCheckedChange={handleSoundEnabledChange}
              />
            </div>
            <p className="text-xs text-muted-foreground -mt-4">
              Play sounds for alerts and notifications
            </p>

            <Separator />

            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="compact-sidebar" className="cursor-pointer">
                  Compact sidebar
                </Label>
              </div>
              <Switch
                id="compact-sidebar"
                checked={compactSidebar}
                onCheckedChange={handleCompactSidebarChange}
              />
            </div>
            <p className="text-xs text-muted-foreground -mt-4">
              Use a narrower sidebar layout
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
