"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type PixelButtonProps = React.ComponentProps<"button"> & {
  variant?: "neon" | "silver" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  shine?: boolean;
  asChild?: boolean;
};

const sizeMap: Record<NonNullable<PixelButtonProps["size"]>, string> = {
  sm: "px-3 py-2 text-[10px]",
  md: "px-5 py-3 text-xs",
  lg: "px-7 py-4 text-sm",
  xl: "px-8 py-5 text-sm sm:text-base",
};

const variantMap: Record<NonNullable<PixelButtonProps["variant"]>, string> = {
  neon:
    "bg-gradient-to-r from-violet-600 to-violet-500 text-white border border-violet-400/30 hover:from-violet-500 hover:to-violet-400 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.5)] hover:shadow-[0_8px_30px_-4px_rgba(139,92,246,0.6)]",
  silver:
    "bg-white/5 text-zinc-200 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm",
  ghost:
    "bg-transparent text-zinc-300 border border-transparent hover:bg-white/5 hover:text-white",
  danger:
    "bg-gradient-to-r from-red-600 to-red-500 text-white border border-red-400/30 hover:from-red-500 hover:to-red-400 shadow-[0_4px_20px_-4px_rgba(239,68,68,0.5)]",
};

export const PixelButton = React.forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ className, variant = "neon", size = "md", shine = true, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="pixel-button"
        className={cn(
          "relative inline-flex items-center justify-center gap-2 uppercase tracking-wide select-none",
          "rounded-xl font-pixel transition-all duration-300 active:scale-[0.97]",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none",
          sizeMap[size],
          variantMap[variant],
          shine && "btn-shine",
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
PixelButton.displayName = "PixelButton";
