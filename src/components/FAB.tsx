import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FABProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

/**
 * Floating Action Button component for primary actions.
 * Positioned fixed at bottom-right by default.
 */
export function FAB({ onClick, className, label = "Dodaj" }: FABProps) {
  return (
    <Button
      size="lg"
      className={cn(
        "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all",
        "md:h-16 md:w-16",
        className
      )}
      onClick={onClick}
      aria-label={label}
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
