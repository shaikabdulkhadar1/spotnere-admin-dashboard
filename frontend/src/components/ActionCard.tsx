import { ArrowUpRight, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: "blue" | "yellow" | "green" | "purple";
}

export function ActionCard({ title, description, icon: Icon, color }: ActionCardProps) {
  const colorClasses = {
    blue: "bg-action-blue text-action-blue-text",
    yellow: "bg-action-yellow text-action-yellow-text",
    green: "bg-action-green text-action-green-text",
    purple: "bg-action-purple text-action-purple-text",
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`${colorClasses[color]} rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-md relative`}
    >
      <div className="flex-1">
        <h3 className="font-semibold mb-1 pr-8">{title}</h3>
        <p className="text-xs opacity-70">{description}</p>
      </div>
      <ArrowUpRight className="w-5 h-5 absolute top-4 right-4" />
    </motion.div>
  );
}
