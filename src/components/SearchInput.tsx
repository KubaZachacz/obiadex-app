import { useId, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2" aria-label="Ładowanie...">
          <svg
            className="size-4 animate-spin text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}
    </div>
  );
}
