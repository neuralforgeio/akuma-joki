"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type PixelButtonProps = React.ComponentProps<"button"> & {
  variant?: "neon" | "silver" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  shine?: boolean;
  /** When true, render as the child element (e.g. next/link) via Radix Slot. */
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
    "bg-[#a020f0] text-white border-[#a020f0] hover:bg-[#c44bff] hover:border-[#c44bff] shadow-[0_0_14px_rgba(160,32,240,0.55)] hover:shadow-[0_0_22px_rgba(160,32,240,0.85)]",
  silver:
    "bg-transparent text-[#e5e5e5] border-[#e5e5e5] hover:bg-[#e5e5e5] hover:text-[#0a0a0a] shadow-[0_0_10px_rgba(229,229,229,0.25)]",
  ghost:
    "bg-transparent text-[#e5e5e5] border-transparent hover:bg-[#a020f0]/15 hover:text-[#c44bff]",
  danger:
    "bg-[#ff3b6b] text-white border-[#ff3b6b] hover:bg-[#ff5c84] shadow-[0_0_14px_rgba(255,59,107,0.55)]",
};

export const PixelButton = React.forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ className, variant = "neon", size = "md", shine = true, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="pixel-button"
        className={cn(
          "font-pixel relative inline-flex items-center justify-center gap-2 uppercase tracking-wide select-none",
          "border-2 pixel-corner transition-all duration-200 active:translate-y-[2px] active:shadow-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
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
