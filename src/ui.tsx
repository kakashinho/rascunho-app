import React, { useEffect } from "react"

// ---------------------------------------------------------------------------
// Componentes reutilizáveis com linguagem Material Design 3
// ---------------------------------------------------------------------------

export function Icon({ name, className = "", fill = false, style }: { name: string; className?: string; fill?: boolean; style?: React.CSSProperties }) {
  return (
    <span className={`msym ${fill ? "fill" : ""} ${className}`} style={style} aria-hidden>
      {name}
    </span>
  )
}

type BtnVariant = "filled" | "tonal" | "outlined" | "text" | "elevated"

export function Button({
  variant = "filled",
  icon,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; icon?: string }) {
  const base =
    "state-layer inline-flex items-center justify-center gap-2 h-10 px-6 rounded-full text-sm font-medium transition-shadow select-none disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap"
  const variants: Record<BtnVariant, string> = {
    filled: "bg-primary text-on-primary",
    tonal: "bg-secondary-container text-on-secondary-container",
    outlined: "border border-outline text-primary bg-transparent",
    text: "text-primary bg-transparent px-4",
    elevated: "bg-surface text-primary shadow-sm",
  }
  return (
    <button className={`${base} ${variants[variant]} ${icon && !children ? "!w-10 !px-0" : ""} ${className}`} {...props}>
      {icon && <Icon name={icon} className="text-[20px]" />}
      {children}
    </button>
  )
}

export function FAB({ icon, label, onClick, className = "" }: { icon: string; label?: string; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`state-layer inline-flex items-center gap-2 h-14 ${label ? "px-5" : "w-14 justify-center"} rounded-2xl bg-primary-container text-on-primary-container shadow-lg transition-transform active:scale-95 ${className}`}
    >
      <Icon name={icon} className="text-[24px]" />
      {label && <span className="text-sm font-medium pr-1">{label}</span>}
    </button>
  )
}

export function IconButton({ name, onClick, className = "", fill = false, "aria-label": label }: { name: string; onClick?: () => void; className?: string; fill?: boolean; "aria-label"?: string }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`state-layer w-10 h-10 rounded-full inline-flex items-center justify-center text-on-surface-variant ${className}`}
    >
      <Icon name={name} className="text-[22px]" fill={fill} />
    </button>
  )
}

export function Chip({ selected, onClick, icon, children }: { selected?: boolean; onClick?: () => void; icon?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`state-layer inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[13px] font-medium transition-colors ${
        selected ? "bg-secondary-container text-on-secondary-container border-transparent" : "border-outline-variant text-on-surface-variant"
      }`}
    >
      {selected && <Icon name="check" className="text-[16px]" />}
      {icon && !selected && <Icon name={icon} className="text-[16px]" />}
      {children}
    </button>
  )
}

export function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface rounded-3xl border border-outline-variant/60 ${onClick ? "state-layer cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  icon,
  error,
  placeholder,
  trailing,
  onTrailingClick,
  multiline,
  ...rest
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  icon?: string
  error?: string
  placeholder?: string
  trailing?: string
  onTrailingClick?: () => void
  multiline?: boolean
} & Record<string, unknown>) {
  const border = error ? "border-error" : "border-outline focus-within:border-primary"
  return (
    <label className="block">
      <div className={`flex items-center gap-2 rounded-xl border ${border} bg-surface px-3 transition-colors ${multiline ? "items-start py-2" : "h-14"}`}>
        {icon && <Icon name={icon} className={`text-[20px] text-on-surface-variant ${multiline ? "mt-2.5" : ""}`} />}
        <span className="flex-1 flex flex-col justify-center min-w-0">
          <span className={`text-[11px] font-medium ${error ? "text-error" : "text-on-surface-variant"}`}>{label}</span>
          {multiline ? (
            <textarea
              value={value}
              rows={2}
              placeholder={placeholder}
              onChange={(e) => onChange(e.target.value)}
              className="bg-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50 resize-none"
              {...(rest as object)}
            />
          ) : (
            <input
              value={value}
              type={type}
              placeholder={placeholder}
              onChange={(e) => onChange(e.target.value)}
              className="bg-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50"
              {...(rest as object)}
            />
          )}
        </span>
        {trailing && <IconButton name={trailing} onClick={onTrailingClick} />}
      </div>
      {error && (
        <span className="flex items-center gap-1 text-[12px] text-error mt-1 px-1">
          <Icon name="error" className="text-[14px]" />
          {error}
        </span>
      )}
    </label>
  )
}

export function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-[52px] h-8 rounded-full border-2 transition-colors ${
        checked ? "bg-primary border-primary" : "bg-surface-variant border-outline"
      }`}
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 rounded-full transition-all ${
          checked ? "left-[26px] w-6 h-6 bg-on-primary" : "left-1.5 w-4 h-4 bg-outline"
        }`}
      />
    </button>
  )
}

// Bottom sheet / modal
export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 om-scrim" onClick={onClose} />
      <div className="relative w-full max-h-[92%] overflow-y-auto bg-surface rounded-t-[28px] om-sheet pb-6">
        <div className="sticky top-0 bg-surface pt-3 pb-2 z-10">
          <div className="mx-auto w-9 h-1 rounded-full bg-outline-variant" />
          {title && <h2 className="text-lg font-medium text-on-surface px-5 pt-3">{title}</h2>}
        </div>
        <div className="px-5">{children}</div>
      </div>
    </div>
  )
}

export function Dialog({ open, onClose, title, children, actions, icon }: { open: boolean; onClose: () => void; title: string; children?: React.ReactNode; actions: React.ReactNode; icon?: string }) {
  if (!open) return null
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 om-scrim" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface rounded-[28px] p-6 om-pop">
        {icon && (
          <div className="flex justify-center mb-3">
            <Icon name={icon} className="text-[28px] text-secondary-container-foreground text-primary" />
          </div>
        )}
        <h2 className="text-xl font-normal text-on-surface mb-2 text-center">{title}</h2>
        {children && <div className="text-sm text-on-surface-variant text-center mb-5">{children}</div>}
        <div className="flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  )
}

export function Snackbar({ label, actionLabel, onAction, onClose }: { label: string; actionLabel?: string; onAction?: () => void; onClose?: () => void }) {
  return (
    <div className="absolute bottom-24 left-4 right-4 z-40 om-slide-up">
      <div className="flex items-center gap-3 bg-[#322f2a] dark:bg-[#e6e2d8] text-[#f2efe6] dark:text-[#1c1b17] rounded-xl px-4 py-3 shadow-lg">
        <span className="flex-1 text-sm">{label}</span>
        {actionLabel && (
          <button onClick={onAction} className="text-sm font-medium text-primary-container dark:text-primary uppercase tracking-wide">
            {actionLabel}
          </button>
        )}
        {onClose && <IconButton name="close" onClick={onClose} className="!w-8 !h-8 !text-current" />}
      </div>
    </div>
  )
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`om-skeleton bg-outline-variant rounded-lg ${className}`} />
}

export function EmptyState({ icon, title, description, action }: { icon: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8 om-fade">
      <div className="w-20 h-20 rounded-full bg-surface-variant flex items-center justify-center mb-4">
        <Icon name={icon} className="text-[36px] text-on-surface-variant" />
      </div>
      <h3 className="text-base font-medium text-on-surface mb-1">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-[240px] mb-4">{description}</p>
      {action}
    </div>
  )
}

export function SegmentedControl<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-full border border-outline overflow-hidden w-full">
      {options.map((o, i) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`state-layer flex-1 h-9 text-[13px] font-medium transition-colors ${
            value === o.value ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant"
          } ${i > 0 ? "border-l border-outline" : ""}`}
        >
          {value === o.value && <Icon name="check" className="text-[15px] mr-1 align-middle" />}
          {o.label}
        </button>
      ))}
    </div>
  )
}
