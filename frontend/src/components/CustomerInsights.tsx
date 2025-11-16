import { Users, UserCheck, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const customerStats = [
  { label: "New Customers", value: 115, icon: UserPlus, color: "bg-blue-100 text-blue-600" },
  { label: "VIP Customers", value: 12, icon: UserCheck, color: "bg-yellow-100 text-yellow-600" },
  { label: "Total Customers", value: 2847, icon: Users, color: "bg-green-100 text-green-600" },
];

const topCustomers = [
  { name: "Alice Johnson", role: "Member", amount: "$2,340" },
  { name: "Robert Smith", role: "VIP", amount: "$1,980" },
  { name: "Maria Garcia", role: "Member", amount: "$1,850" },
];

export function CustomerInsights() {
  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      <h3 className="font-semibold text-lg">Customer Insights</h3>
      
      <div className="space-y-3">
        {customerStats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-sm font-medium">Active</p>
              </div>
            </div>
            <span className="font-semibold">{stat.value}</span>
          </div>
        ))}
      </div>

      <div>
        <h4 className="font-medium mb-3">Top Customers</h4>
        <div className="space-y-3">
          {topCustomers.map((customer) => (
            <div key={customer.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.role}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-green-600">{customer.amount}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">Customer Retention</h4>
          <span className="text-sm font-semibold text-green-600">60%</span>
        </div>
        <Progress value={60} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">+2.4% from last month</p>
      </div>
    </div>
  );
}
