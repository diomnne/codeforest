"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "default" | "accent";

const VARIANT: Record<Variant, string> = {
  default: "text-(--ui-fg)",
  accent: "bg-(--ui-accent) text-(--ui-accent-fg)",
};

export function Panel({
  as: Tag = "div",
  large = false,
  className = "",
  children,
  ...rest
}: {
  as?: "div" | "aside" | "section" | "header";
  large?: boolean;
  className?: string;
  children: ReactNode;
} & ComponentProps<"div">) {
  return (
    <Tag
      className={`brut ${large ? "brut-lg" : ""} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Button({
  variant = "default",
  className = "",
  children,
  ...rest
}: {
  variant?: Variant;
  className?: string;
  children: ReactNode;
} & ComponentProps<"button">) {
  return (
    <button
      className={`brut brut-press cursor-pointer px-4 py-2 text-xs font-bold uppercase disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "default",
  className = "",
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link
      href={href}
      className={`brut brut-press inline-block cursor-pointer px-4 py-2 text-center text-xs font-bold uppercase ${VARIANT[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
    icon?: ReactNode;
};

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="brut overflow-hidden flex items-center">
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            aria-label={opt.icon ? opt.label : undefined}
            title={opt.icon ? opt.label : undefined}
            className={`brut-theme flex cursor-pointer items-center justify-center font-bold uppercase ${
              opt.icon 
                ? "h-8 w-8 sm:h-10 sm:w-10" 
                : "px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs"
            } ${i > 0 ? "border-l-2 border-(--ui-border)" : ""} ${
              active
                ? "bg-(--ui-accent) text-(--ui-accent-fg)"
                : "text-(--ui-fg-muted) hover:bg-(--ui-hover) hover:text-(--ui-fg)"
            }`}
          >
            {opt.icon ?? opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Label({
  as: Tag = "p",
  className = "",
  children,
  ...rest
}: {
  as?: "p" | "span" | "label";
  className?: string;
  children: ReactNode;
    htmlFor?: string;
}) {
  return (
    <Tag
      className={`text-[10px] font-bold tracking-wider uppercase text-(--ui-fg-muted) ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Scrim() {
  return <div className="absolute inset-0 bg-(--ui-scrim)" />;
}
