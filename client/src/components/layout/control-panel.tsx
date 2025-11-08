import * as React from "react";
import { cn } from "@/lib/utils";

interface ControlPanelProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * ControlPanel - Collapsible section for tool controls in sidebars
 */
export default function ControlPanel({
  title,
  children,
  defaultOpen = true,
  className,
}: ControlPanelProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("border-b last:border-b-0", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
      >
        <h3 className="font-semibold text-sm">{title}</h3>
        <svg
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen ? "rotate-180" : ""
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && <div className="px-4 py-3 space-y-4">{children}</div>}
    </div>
  );
}
