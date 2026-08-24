import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40",
        "transition-colors",
        className,
      )}
      {...props}
    />
  );
});

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-[13px] font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function FieldHint({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>
  );
}

export function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600"
    >
      {children}
    </p>
  );
}
