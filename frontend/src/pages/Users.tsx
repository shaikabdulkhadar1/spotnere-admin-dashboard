import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Edit, Trash2, Mail, Calendar } from "lucide-react";

const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    role: "user",
    status: "active",
    joinedDate: "2024-01-15",
    bookings: 12,
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "host",
    status: "active",
    joinedDate: "2024-02-20",
    bookings: 8,
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike.j@example.com",
    role: "user",
    status: "active",
    joinedDate: "2024-03-10",
    bookings: 23,
  },
  {
    id: 4,
    name: "Sarah Williams",
    email: "sarah.w@example.com",
    role: "admin",
    status: "active",
    joinedDate: "2023-12-01",
    bookings: 5,
  },
];

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Users"
        description="Manage user accounts and permissions"
      />

      {/* Search */}
      <GlassCard>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>
      </GlassCard>

      {/* Users Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">User</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Email</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Role</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Joined</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Bookings</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="border-b border-border/30 hover:bg-background/50 transition-colors group"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-primary/20">
                        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={
                        user.role === "admin" ? "default" :
                        user.role === "host" ? "secondary" :
                        "outline"
                      }
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="default">
                      {user.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(user.joinedDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">{user.bookings}</td>
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
