import type { ReactNode } from "react";
import { adminShell } from "@/lib/design/admin-shell";
import { cn } from "@/lib/utils";

/** Input / select class with optional error state */
export function adminInputClass(hasError?: boolean, className?: string) {
  return cn(adminShell.input, hasError && adminShell.inputError, className);
}

export function adminTextareaClass(hasError?: boolean, className?: string) {
  return cn(adminShell.textarea, hasError && adminShell.inputError, className);
}

export function adminSelectClass(hasError?: boolean, className?: string) {
  return cn(adminShell.select, "w-full", hasError && adminShell.inputError, className);
}

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AdminSectionCard({
  title,
  description,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <section className={cn(adminShell.cardSection, "p-6", className)}>
      <h2 className={adminShell.sectionTitleSm}>{title}</h2>
      {description && <p className={adminShell.sectionDesc}>{description}</p>}
      <div className={cn(description ? "mt-4" : "mt-4", contentClassName)}>{children}</div>
    </section>
  );
}

type FieldGroupProps = {
  label: string;
  required?: boolean;
  error?: string[];
  hint?: string;
  className?: string;
  children: ReactNode;
};

export function AdminFieldGroup({
  label,
  required,
  error,
  hint,
  className,
  children,
}: FieldGroupProps) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-foreground/90">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error?.[0] ? (
        <p className="mt-1 text-xs text-red-600">{error[0]}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

type ToolbarProps = {
  children: ReactNode;
  className?: string;
};

export function AdminToolbar({ children, className }: ToolbarProps) {
  return <div className={cn(adminShell.cardToolbar, className)}>{children}</div>;
}

type TableShellProps = {
  children: ReactNode;
  className?: string;
};

export function AdminTableShell({ children, className }: TableShellProps) {
  return (
    <div className={cn(adminShell.tableShell, className)}>
      <div className="min-w-[640px]">{children}</div>
    </div>
  );
}

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function AdminEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        adminShell.emptyState,
        "flex flex-col items-center justify-center gap-2 px-6 py-16 text-center",
        className,
      )}
    >
      {icon}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function AdminModal({ title, onClose, children, className }: ModalProps) {
  return (
    <div className={adminShell.modalOverlay} onClick={onClose}>
      <div
        className={cn(adminShell.modalPanel, className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn("flex items-center justify-between border-b px-5 py-4", adminShell.dividerSoft)}>
          <h2 className={adminShell.sectionTitleSm}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminFormFeedback({
  error,
  success,
  className,
}: {
  error?: string | null;
  success?: string | null;
  className?: string;
}) {
  if (!error && !success) return null;
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        error
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
        className,
      )}
    >
      {error ?? success}
    </div>
  );
}

export function AdminToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-border text-copper focus:ring-copper/20"
      />
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}
