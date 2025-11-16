import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash2, Globe, MapPin } from "lucide-react";

const mockCities = [
  {
    id: 1,
    name: "New York",
    country: "United States",
    places: 847,
    featured: true,
  },
  {
    id: 2,
    name: "Los Angeles",
    country: "United States",
    places: 623,
    featured: true,
  },
  {
    id: 3,
    name: "Chicago",
    country: "United States",
    places: 412,
    featured: false,
  },
  {
    id: 4,
    name: "Miami",
    country: "United States",
    places: 389,
    featured: true,
  },
  {
    id: 5,
    name: "London",
    country: "United Kingdom",
    places: 1205,
    featured: true,
  },
];

export default function Cities() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Cities & Countries"
        description="Manage geographic locations and regions"
        action={{
          label: "Add New City",
          onClick: () => console.log("Add new city"),
        }}
      />

      {/* Search */}
      <GlassCard>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cities or countries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>
      </GlassCard>

      {/* Cities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCities.map((city, index) => (
          <motion.div
            key={city.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * index }}
          >
            <GlassCard hover className="relative overflow-hidden">
              {city.featured && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-primary to-accent">
                    Featured
                  </Badge>
                </div>
              )}
              
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{city.name}</h3>
                  <p className="text-sm text-muted-foreground">{city.country}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-background/50">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm">
                  <span className="font-semibold text-primary">{city.places}</span>
                  {" "}places
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
