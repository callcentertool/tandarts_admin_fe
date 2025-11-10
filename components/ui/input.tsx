import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean;
  errorMessage?: string;
  customPlaceholder?: React.ReactNode; // new prop for JSX placeholder
  label?: string; //  new label prop
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error,
      errorMessage,
      customPlaceholder,
      value,
      label,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = React.useState(false);
    const showCustomPlaceholder = !focused && !value && customPlaceholder;

    return (
      <div className="w-full relative">
         {/* Label */}
         {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-12 w-full min-w-0 rounded-md border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            error &&
              "border-destructive ring-destructive/20 dark:ring-destructive/40",
            className
          )}
          {...props}
        />

        {/* ✅ Custom JSX placeholder */}
        {showCustomPlaceholder && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-sm">
            {customPlaceholder}
          </div>
        )}

        {error && errorMessage && (
          <p className="text-xs text-destructive mt-1 px-1">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
