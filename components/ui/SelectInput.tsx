import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.ComponentProps<"select"> {
  error?: boolean;
  errorMessage?: string;
  label?: string;
  placeholder?: string;
  options?: { value: string; label: string; title?: string }[];
  children?: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      error,
      errorMessage,
      label,
      placeholder = "Select an option",
      options,
      children,
      value,
      ...props
    },
    ref
  ) => {
    return (
      <div style={{ marginTop: "0px !important" }} className="w-full relative">
        {/* Label */}
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
            {label}
          </label>
        )}

        {/* Select */}
        <select
          ref={ref}
          value={value}
          data-slot="select"
          className={cn(
            "border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-12 w-full min-w-0 rounded-md border px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            error &&
              "border-destructive ring-destructive/20 dark:ring-destructive/40",
            className
          )}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>

          {/* Options from props */}
          {options?.map((option) => (
            <option key={option.value} value={option.value} title={option.title || option.label}>
              {option.label}
            </option>
          ))}

          {/* Custom children */}
          {children}
        </select>

        {/* Error Message */}
        {error && errorMessage && (
          <p className="text-xs text-destructive mt-1 px-1">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
