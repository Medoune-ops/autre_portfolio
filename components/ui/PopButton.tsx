import React from "react";
import { cn } from "@/lib/utils";

export type PopButtonVariant = "primary" | "secondary" | "pop" | "accent";
export type PopButtonSize = "sm" | "md" | "lg";

type BaseProps = {
  variant?: PopButtonVariant;
  size?: PopButtonSize;
  className?: string;
  children?: React.ReactNode;
};

export type PopButtonAsButton = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    as?: "button";
    href?: undefined;
  };

export type PopButtonAsLink = BaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & {
    as: "a";
    href: string;
  };

export type PopButtonProps = PopButtonAsButton | PopButtonAsLink;

const variantStyles: Record<PopButtonVariant, string> = {
  primary: cn(
    "bg-[#2872a1] text-white border-2 border-[#16232c]",
    "shadow-[0_8px_0_-1px_#1c5a82,0_8px_0_1px_#16232c,0_16px_20px_-6px_rgba(40,114,161,0.4)]",
    "hover:bg-[#1c5a82] hover:translate-y-1 hover:shadow-[0_5px_0_-1px_#1c5a82,0_5px_0_1px_#16232c,0_10px_14px_-4px_rgba(40,114,161,0.35)]",
    "active:translate-y-2 active:shadow-[0_0px_0_-1px_#1c5a82,0_0px_0_1px_#16232c,0_2px_6px_0_rgba(40,114,161,0.2)]"
  ),
  secondary: cn(
    "bg-white text-[#16232c] border-2 border-[#16232c]",
    "shadow-[0_8px_0_-1px_#cbdde9,0_8px_0_1px_#16232c,0_16px_20px_-6px_rgba(22,35,44,0.15)]",
    "hover:bg-slate-50 hover:translate-y-1 hover:shadow-[0_5px_0_-1px_#cbdde9,0_5px_0_1px_#16232c,0_10px_14px_-4px_rgba(22,35,44,0.12)]",
    "active:translate-y-2 active:shadow-[0_0px_0_-1px_#cbdde9,0_0px_0_1px_#16232c,0_2px_4px_0_rgba(22,35,44,0.08)]"
  ),
  accent: cn(
    "bg-[#f59e0b] text-[#16232c] border-2 border-[#16232c]",
    "shadow-[0_8px_0_-1px_#d97706,0_8px_0_1px_#16232c,0_16px_20px_-6px_rgba(245,158,11,0.35)]",
    "hover:bg-[#d97706] hover:text-white hover:translate-y-1 hover:shadow-[0_5px_0_-1px_#d97706,0_5px_0_1px_#16232c,0_10px_14px_-4px_rgba(245,158,11,0.3)]",
    "active:translate-y-2 active:shadow-[0_0px_0_-1px_#d97706,0_0px_0_1px_#16232c,0_2px_4px_0_rgba(245,158,11,0.2)]"
  ),
  pop: cn(
    "text-[#382b22] dark:text-[#382b22] bg-[#fff0f0] border-2 border-[#b18597]",
    "shadow-[0_10px_0_-2px_#f9c4d2,0_10px_0_0_#b18597,0_20px_0_0_#ffe3e2]",
    "hover:bg-[#ffe9e9] hover:translate-y-1 hover:shadow-[0_6px_0_-2px_#f9c4d2,0_6px_0_0_#b18597,0_14px_0_0_#ffe3e2]",
    "active:bg-[#ffe9e9] active:translate-y-2.5 active:shadow-[0_0px_0_-2px_#f9c4d2,0_0px_0_0_#b18597,0_0px_0_0_#ffe3e2]"
  ),
};

const sizeStyles: Record<PopButtonSize, string> = {
  sm: "px-5 py-2.5 text-xs rounded-xl",
  md: "px-7 py-3.5 text-sm rounded-2xl",
  lg: "px-8 py-4.5 text-base rounded-2xl",
};

export const PopButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  PopButtonProps
>(function PopButton(
  {
    variant = "primary",
    size = "md",
    className,
    children = "Learn More",
    ...props
  },
  ref
) {
  const baseClassName = cn(
    "group relative inline-flex items-center justify-center font-bold tracking-tight select-none",
    "transition-all duration-150 ease-[cubic-bezier(0,0,0.58,1)] cursor-pointer outline-none",
    "focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2",
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  if (props.as === "a" || ("href" in props && typeof props.href === "string")) {
    const anchorProps = { ...(props as PopButtonAsLink) };
    delete (anchorProps as { as?: unknown }).as;
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={baseClassName}
        {...anchorProps}
      >
        {children}
      </a>
    );
  }

  const buttonProps = { ...(props as PopButtonAsButton) };
  delete (buttonProps as { as?: unknown }).as;
  const { type = "button", ...restButtonProps } = buttonProps;
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      className={baseClassName}
      {...restButtonProps}
    >
      {children}
    </button>
  );
});

export default PopButton;
