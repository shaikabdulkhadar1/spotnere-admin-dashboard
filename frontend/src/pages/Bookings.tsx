import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Calendar, MapPin, User } from "lucide-react";

const mockBookings = [
  {
    id: "BK-2024-001",
    user: "John Doe",
    place: "Urban Climbing Gym",
    date: "2024-12-20",
    time: "14:00",
    status: "confirmed",
    amount: "$45",
  },
  {
    id: "BK-2024-002",
    user: "Jane Smith",
    place: "Zen Yoga Studio",
    date: "2024-12-21",
    time: "10:00",
    status: "pending",
    amount: "$30",
  },
  {
    id: "BK-2024-003",
    user: "Mike Johnson",
    place: "VR Gaming Arena",
    date: "2024-12-22",
    time: "18:00",
    status: "confirmed",
    amount: "$60",
  },
  {
    id: "BK-2024-004",
    user: "Sarah Williams",
    place: "Rooftop Bar",
    date: "2024-12-19",
    time: "20:00",
    status: "completed",
    amount: "$85",
  },
  {
    id: "BK-2024-005",
    user: "Tom Brown",
    place: "Art Gallery Downtown",
    date: "2024-12-23",
    time: "15:00",
    status: "cancelled",
    amount: "$25",
  },
];

export default function Bookings() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Bookings"
        description="Manage all reservations and appointments"
      />

      {/* Filters */}
      <GlassCard>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
          
          <Select>
            <SelectTrigger className="w-full md:w-[180px] bg-background/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="glass">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Bookings Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Booking ID</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">User</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Place</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Date & Time</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Amount</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockBookings.map((booking, index) => (
                <motion.tr
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="border-b border-border/30 hover:bg-background/50 transition-colors group"
                >
                  <td className="py-4 px-4 font-mono text-sm text-primary">{booking.id}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{booking.user}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{booking.place}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{booking.date} at {booking.time}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={
                        booking.status === "confirmed" ? "default" :
                        booking.status === "pending" ? "secondary" :
                        booking.status === "completed" ? "outline" :
                        "destructive"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 font-semibold">{booking.amount}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-primary/10 hover:text-primary transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
