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
import { Search, Edit, Trash2, MapPin, Star } from "lucide-react";

const mockPlaces = [
  {
    id: 1,
    name: "Urban Climbing Gym",
    category: "Sports",
    city: "New York",
    status: "active",
    bookings: 234,
    rating: 4.8,
  },
  {
    id: 2,
    name: "Zen Yoga Studio",
    category: "Wellness",
    city: "Los Angeles",
    status: "active",
    bookings: 189,
    rating: 4.9,
  },
  {
    id: 3,
    name: "VR Gaming Arena",
    category: "Entertainment",
    city: "Chicago",
    status: "draft",
    bookings: 0,
    rating: 0,
  },
  {
    id: 4,
    name: "Rooftop Bar",
    category: "Nightlife",
    city: "Miami",
    status: "active",
    bookings: 567,
    rating: 4.6,
  },
  {
    id: 5,
    name: "Art Gallery Downtown",
    category: "Culture",
    city: "New York",
    status: "pending",
    bookings: 45,
    rating: 4.5,
  },
];

export default function Places() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Places"
        description="Manage all venues and experiences on Spotnere"
        action={{
          label: "Add New Place",
          onClick: () => console.log("Add new place"),
        }}
      />

      {/* Filters */}
      <GlassCard>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
          
          <Select>
            <SelectTrigger className="w-full md:w-[180px] bg-background/50">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="glass">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="wellness">Wellness</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
              <SelectItem value="nightlife">Nightlife</SelectItem>
              <SelectItem value="culture">Culture</SelectItem>
            </SelectContent>
          </Select>
          
          <Select>
            <SelectTrigger className="w-full md:w-[180px] bg-background/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="glass">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Places Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Place Name</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Category</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">City</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Bookings</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Rating</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockPlaces.map((place, index) => (
                <motion.tr
                  key={place.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="border-b border-border/30 hover:bg-background/50 transition-colors group"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium">{place.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">{place.category}</td>
                  <td className="py-4 px-4 text-muted-foreground">{place.city}</td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={
                        place.status === "active" ? "default" :
                        place.status === "draft" ? "secondary" :
                        "outline"
                      }
                    >
                      {place.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">{place.bookings}</td>
                  <td className="py-4 px-4">
                    {place.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{place.rating}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No ratings</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-primary/10 hover:text-primary transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-destructive/10 hover:text-destructive transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
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
