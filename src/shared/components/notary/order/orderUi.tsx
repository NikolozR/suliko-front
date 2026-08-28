"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/** Shared field + tile primitives for the order wizard steps. */

export function FieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-medium text-muted-foreground mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

const inputClass = (invalid?: boolean) =>
  `w-full px-3 py-2 rounded-lg border bg-card text-foreground text-sm transition-colors outline-none ` +
  `focus:ring-2 focus:ring-primary/25 ${
    invalid ? "border-red-400 focus:border-red-500" : "border-border focus:border-primary"
  }`;

export function TextField({
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={inputClass(Boolean(error))}
      />
      <FieldError message={error} />
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  error,
  min,
  max,
  required,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  min: number;
  max: number;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const parsed = parseInt(e.target.value, 10);
          onChange(Number.isNaN(parsed) ? min : parsed);
        }}
        onBlur={(e) => {
          const parsed = parseInt(e.target.value, 10);
          if (Number.isNaN(parsed) || parsed < min) onChange(min);
          else if (parsed > max) onChange(max);
        }}
        aria-invalid={Boolean(error)}
        className={inputClass(Boolean(error))}
      />
      <FieldError message={error} />
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          style={{ backgroundImage: "none" }}
          className={`${inputClass(Boolean(error))} appearance-none pr-9 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      <FieldError message={error} />
    </div>
  );
}

/** Selectable tile — used for service type, copy type, urgency and client type. */
export function Tile({
  selected,
  onClick,
  title,
  subtitle,
  badge,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all duration-200 ${
        selected
          ? "border-suliko-default-color bg-suliko-default-color/10 ring-1 ring-suliko-default-color/30"
          : "border-border bg-card hover:border-suliko-default-color/40 hover:bg-muted/40"
      }`}
    >
      <span className="flex w-full items-center gap-2">
        {icon}
        <span
          className={`text-sm font-semibold leading-tight ${
            selected ? "text-suliko-default-color" : "text-foreground"
          }`}
        >
          {title}
        </span>
        {badge && (
          <span className="ml-auto shrink-0 rounded-full bg-suliko-default-color/15 px-2 py-0.5 text-[10px] font-bold text-suliko-default-color">
            {badge}
          </span>
        )}
      </span>
      {subtitle && (
        <span className="text-xs text-muted-foreground leading-snug">{subtitle}</span>
      )}
    </button>
  );
}

export function CheckTile({
  checked,
  onToggle,
  title,
  subtitle,
  badge,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="checkbox"
      aria-checked={checked}
      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${
        checked
          ? "border-suliko-default-color bg-suliko-default-color/10"
          : "border-border bg-card hover:border-suliko-default-color/40 hover:bg-muted/40"
      }`}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          checked
            ? "border-suliko-default-color bg-suliko-default-color"
            : "border-muted-foreground/40"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" aria-hidden="true">
            <path
              d="M2 6.5L4.5 9L10 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {badge && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {badge}
            </span>
          )}
        </span>
        {subtitle && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{subtitle}</span>
        )}
      </span>
    </button>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      <h4 className="text-sm font-semibold text-foreground">{children}</h4>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
