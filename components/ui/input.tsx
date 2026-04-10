import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "input input-bordered h-12 w-full rounded-xl border-base-300/40 bg-base-100/95 text-[1rem] text-base-content ring-1 ring-primary/8 shadow-[0_4px_16px_rgba(30,40,35,0.09)] transition-all duration-200 focus:border-primary/45 focus:bg-base-100 focus:ring-2 focus:ring-primary/30 focus:shadow-[0_8px_22px_rgba(30,40,35,0.15)] focus:outline-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
