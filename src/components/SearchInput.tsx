import { useId, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CloseIcon, LoadingSpinnerIcon, SearchIcon } from "@/components/icons";

interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export function SearchInput({
  value = "",
  onChange,
  isLoading = false,
  placeholder = "Szukaj dań...",
  maxLength = 80,
  className,
}: SearchInputProps) {
  const inputId = useId();
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue.trim());
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  const hasValue = localValue.length > 0;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />

        <Input
          id={inputId}
          type="search"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={isLoading}
          className="pl-9 pr-9"
          aria-label="Wyszukaj dania"
        />

        {hasValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={isLoading}
            className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
            aria-label="Wyczyść wyszukiwanie"
          >
            <CloseIcon />
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2" aria-label="Ładowanie...">
          <LoadingSpinnerIcon className="animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
