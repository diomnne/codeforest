"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Shared UI primitives.
 *
 * Every surface in the app is one of these, so the neobrutalist rules —
 * 2px border, zero radius, hard offset shadow, uppercase mono labels — live in
 * one place rather than being re-typed on each element.
 */

type Variant = "default" | "accent";

const VARIANT: Record<Variant, string> = {
  default: "text-(--ui-fg)",
  accent: "bg-(--ui-accent) text-(--ui-accent-fg)",
};

/** A bordered, shadowed block. The base surface for cards and dialogs. */
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

/** Pressable button with the shared press-into-shadow behaviour. */
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

/** Same styling as Button, for internal navigation. */
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

/**
 * Segmented control — a single bordered group whose options share dividers.
 * Used for the day/night and date-range switches.
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="brut flex items-center">
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`brut-theme cursor-pointer px-4 py-2 text-xs font-bold uppercase ${
              i > 0 ? "border-l-2 border-(--ui-border)" : ""
            } ${
              active
                ? "bg-(--ui-accent) text-(--ui-accent-fg)"
                : "text-(--ui-fg-muted) hover:bg-(--ui-hover) hover:text-(--ui-fg)"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Small uppercase label used above values and inputs. */
export function Label({
  as: Tag = "p",
  className = "",
  children,
  ...rest
}: {
  as?: "p" | "span" | "label";
  className?: string;
  children: ReactNode;
  /** `htmlFor` when rendering as a <label>. */
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

/** Full-bleed scrim behind a modal dialog. */
export function Scrim() {
  return <div className="absolute inset-0 bg-(--ui-scrim)" />;
}
