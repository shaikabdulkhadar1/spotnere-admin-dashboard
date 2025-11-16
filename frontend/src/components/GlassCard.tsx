import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card p-6",
        hover && "transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_hsl(var(--primary)/0.3)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
