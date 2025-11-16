import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-6"
    >
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-gradient-to-r from-primary to-accent hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-all duration-300 gap-2"
        >
          <Plus className="w-4 h-4" />
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
