import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CloseIcon, ErrorIcon, InfoIcon, SuccessIcon } from "@/components/icons";

interface FormMessageProps {
  status: "error" | "success" | "info";
  message: string;
  onClose?: () => void;
  autoHide?: boolean;
  autoHideDuration?: number;
  className?: string;
}

export function FormMessage({
  status,
  message,
  onClose,
  autoHide = false,
  autoHideDuration = 5000,
  className,
}: FormMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && status === "success") {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDuration, onClose, status]);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const statusConfig = {
    error: {
      bgColor: "bg-destructive/10 dark:bg-destructive/20",
      textColor: "text-destructive",
      borderColor: "border-destructive/30",
      icon: <ErrorIcon />,
      ariaLive: "assertive" as const,
    },
    success: {
      bgColor: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-800 dark:text-green-400",
      borderColor: "border-green-200 dark:border-green-800",
      icon: <SuccessIcon />,
      ariaLive: "polite" as const,
    },
    info: {
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-800 dark:text-blue-400",
      borderColor: "border-blue-200 dark:border-blue-800",
      icon: <InfoIcon />,
      ariaLive: "polite" as const,
    },
  };

  const config = statusConfig[status];

  return (
    <div
      role="alert"
      aria-live={config.ariaLive}
      className={cn("flex items-start gap-3 rounded-md border p-4", config.bgColor, config.borderColor, className)}
    >
      <div className={cn("mt-0.5", config.textColor)}>{config.icon}</div>
      <div className={cn("flex-1 text-sm", config.textColor)}>{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={handleClose}
          className={cn(
            "rounded-sm p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            config.textColor
          )}
          aria-label="Zamknij wiadomość"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}
