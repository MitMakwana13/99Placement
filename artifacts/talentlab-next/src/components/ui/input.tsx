import * as React from "react";
import { twMerge } from "tailwind-merge";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={twMerge(
          "flex h-11 w-full rounded-2xl border border-border/80 bg-card px-4 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary shadow-[0_1px_2px_rgba(0,0,0,0.02)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:border-border",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
