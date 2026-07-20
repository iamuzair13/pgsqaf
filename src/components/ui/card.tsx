"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface TabItem {
  id: string
  label: string
  icon?: LucideIcon
  badge?: number | string
  disabled?: boolean
}

interface TabsProps {
  tabs: TabItem[]
  defaultTab?: string
  activeTab?: string
  onChange?: (tabId: string) => void
  variant?: "default" | "pills" | "underline" | "cards"
  size?: "sm" | "default" | "lg"
  className?: string
  fullWidth?: boolean
}

/* ------------------------------------------------------------------ */
/*  Tabs Component                                                    */
/* ------------------------------------------------------------------ */

function Tabs({
  tabs,
  defaultTab,
  activeTab: controlledActive,
  onChange,
  variant = "default",
  size = "default",
  className,
  fullWidth = false,
}: TabsProps) {
  const [internalActive, setInternalActive] = React.useState(
    defaultTab || tabs[0]?.id
  )
  const active = controlledActive ?? internalActive

  const handleChange = (tabId: string) => {
    if (tabs.find((t) => t.id === tabId)?.disabled) return
    setInternalActive(tabId)
    onChange?.(tabId)
  }

  const sizeClasses = {
    sm: "h-8 text-xs",
    default: "h-9 text-[0.8125rem]",
    lg: "h-10 text-sm",
  }

  const variantStyles = {
    default: {
      container: "bg-muted/50 border border-border/50 rounded-lg p-1",
      tab: "relative rounded-md px-3 font-medium transition-colors duration-200",
      active: "text-foreground",
      inactive: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
      indicator: "absolute inset-0 rounded-md bg-background shadow-sm border border-border/40",
    },
    pills: {
      container: "gap-1",
      tab: "relative rounded-full px-4 font-medium transition-colors duration-200",
      active: "text-primary-foreground",
      inactive: "text-muted-foreground hover:text-foreground hover:bg-muted/40",
      indicator: "absolute inset-0 rounded-full bg-primary",
    },
    underline: {
      container: "border-b border-border/40 gap-0",
      tab: "relative px-4 font-medium transition-colors duration-200 rounded-t-md",
      active: "text-foreground",
      inactive: "text-muted-foreground hover:text-foreground hover:bg-muted/30",
      indicator: "absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full",
    },
    cards: {
      container: "gap-2",
      tab: "relative rounded-lg border border-transparent px-4 font-medium transition-all duration-200",
      active: "text-foreground border-border/60 bg-surface-elevated shadow-sm",
      inactive: "text-muted-foreground hover:text-foreground hover:border-border/30 hover:bg-muted/30",
      indicator: null,
    },
  }

  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        "flex items-center",
        variant !== "underline" && "inline-flex",
        fullWidth && "w-full",
        styles.container,
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            disabled={tab.disabled}
            onClick={() => handleChange(tab.id)}
            className={cn(
              "relative flex items-center justify-center gap-2 whitespace-nowrap",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent",
              sizeClasses[size],
              fullWidth && "flex-1",
              styles.tab,
              isActive ? styles.active : styles.inactive
            )}
          >
            {/* Animated background indicator */}
            {isActive && styles.indicator && (
              <motion.div
                layoutId={`tab-indicator-${variant}`}
                className={styles.indicator}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                  mass: 0.8,
                }}
                initial={false}
              />
            )}

            {/* Icon with subtle animation */}
            {Icon && (
              <motion.span
                className="relative z-10 flex items-center"
                animate={{
                  scale: isActive ? 1 : 0.95,
                  opacity: tab.disabled ? 0.4 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <Icon
                  size={size === "sm" ? 14 : size === "lg" ? 18 : 16}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </motion.span>
            )}

            {/* Label */}
            <span className="relative z-10">{tab.label}</span>

            {/* Badge */}
            {tab.badge !== undefined && (
              <motion.span
                initial={false}
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                className={cn(
                  "relative z-10 flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[0.6875rem] font-semibold tabular-nums",
                  isActive
                    ? variant === "pills"
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.badge}
              </motion.span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  TabContent — Animated panel switcher                              */
/* ------------------------------------------------------------------ */

function TabContent({
  children,
  tabId,
  activeTab,
  className,
}: {
  children: React.ReactNode
  tabId: string
  activeTab: string
  className?: string
}) {
  const isActive = tabId === activeTab

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isActive && (
        <motion.div
          key={tabId}
          role="tabpanel"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1],
          }}
          className={cn("outline-none", className)}
          tabIndex={0}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/*  TabStats — Elegant stat cards for tab content                     */
/* ------------------------------------------------------------------ */

function TabStats({
  stats,
  className,
}: {
  stats: {
    label: string
    value: string | number
    change?: string
    trend?: "up" | "down" | "neutral"
    icon?: LucideIcon
  }[]
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {stats.map((stat, i) => {
        const Icon = stat.icon
        const trendColors = {
          up: "text-emerald-600 dark:text-emerald-400",
          down: "text-red-600 dark:text-red-400",
          neutral: "text-muted-foreground",
        }

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: i * 0.05,
              ease: [0.4, 0, 0.2, 1],
            }}
            className={cn(
              "group relative flex flex-col gap-2 rounded-xl border border-border/40 bg-surface-elevated p-5",
              "hover:border-border/60 hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>
              {Icon && (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground group-hover:text-foreground transition-colors">
                  <Icon size={14} strokeWidth={2} />
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-[-0.02em] text-foreground tabular-nums">
                {stat.value}
              </span>
              {stat.change && (
                <span className={cn("text-xs font-medium", trendColors[stat.trend || "neutral"])}>
                  {stat.change}
                </span>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  TabChart — Minimal sparkline placeholder                          */
/* ------------------------------------------------------------------ */

function TabChart({
  data,
  className,
}: {
  data: number[]
  className?: string
}) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((val - min) / range) * 100,
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ")

  const areaD = `${pathD} L 100 100 L 0 100 Z`

  return (
    <div className={cn("relative h-32 w-full rounded-xl border border-border/40 bg-surface-elevated p-4", className)}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <motion.path
          d={areaD}
          fill="url(#chartGradient)"
          className="text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />

        {/* Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.2"
            fill="currentColor"
            className="text-primary"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
          />
        ))}
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Card                                                              */
/* ------------------------------------------------------------------ */

function Card({
  className,
  size = "default",
  hover = true,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  hover?: boolean
}) {
  return (
    <motion.div
      data-slot="card"
      data-size={size}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      whileHover={
        hover
          ? { y: -2, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }
          : undefined
      }
      className={cn(
        "group/card flex flex-col overflow-hidden rounded-lg bg-card",
        "py-5",
        size === "sm" ? "gap-3" : "gap-4",
        "shadow-none",
        hover && "hover:shadow-[0_4px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)]",
        "border border-border/60",
        "text-sm text-foreground",
        className
      )}
      {...(props as object)}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  CardHeader                                                        */
/* ------------------------------------------------------------------ */

function CardHeader({
  className,
  divider = false,
  ...props
}: React.ComponentProps<"div"> & { divider?: boolean }) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1 px-5",
        divider && "border-b border-border/40 pb-4",
        className
      )}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  CardTitle                                                         */
/* ------------------------------------------------------------------ */

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em] text-foreground",
        "group-data-[size=sm]/card:text-[0.9375rem]",
        className
      )}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  CardDescription                                                   */
/* ------------------------------------------------------------------ */

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-[0.8125rem] leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  CardAction                                                        */
/* ------------------------------------------------------------------ */

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("ml-auto flex items-center gap-2 self-start", className)}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  CardContent                                                       */
/* ------------------------------------------------------------------ */

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("px-5", className)} {...props} />
  )
}

/* ------------------------------------------------------------------ */
/*  CardFooter                                                        */
/* ------------------------------------------------------------------ */

function CardFooter({
  className,
  divider = true,
  ...props
}: React.ComponentProps<"div"> & { divider?: boolean }) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-3 px-5",
        divider ? "border-t border-border/40 pt-4" : "pt-0",
        className
      )}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  CardBadge                                                         */
/* ------------------------------------------------------------------ */

function CardBadge({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"span"> & {
  variant?: "default" | "success" | "warning" | "destructive" | "muted"
}) {
  const variants = {
    default: "bg-primary/8 text-primary",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    destructive: "bg-red-500/10 text-red-600 dark:text-red-400",
    muted: "bg-muted text-muted-foreground",
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      data-slot="card-badge"
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide",
        variants[variant],
        className
      )}
      {...(props as object)}
    >
      {children}
    </motion.span>
  )
}

/* ------------------------------------------------------------------ */
/*  CardMetric                                                        */
/* ------------------------------------------------------------------ */

function CardMetric({
  className,
  value,
  label,
  suffix,
  ...props
}: React.ComponentProps<"div"> & {
  value: number
  label: string
  suffix?: string
}) {
  const [displayValue, setDisplayValue] = React.useState(0)

  React.useEffect(() => {
    const duration = 600
    const start = performance.now()
    const to = value

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(to * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [value])

  return (
    <div data-slot="card-metric" className={cn("flex flex-col gap-1", className)} {...props}>
      <div className="flex items-baseline gap-1">
        <span className="text-[1.75rem] font-semibold tracking-[-0.02em] text-foreground tabular-nums">
          {displayValue.toLocaleString()}
        </span>
        {suffix && (
          <span className="text-sm font-medium text-muted-foreground">{suffix}</span>
        )}
      </div>
      <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Exports                                                           */
/* ------------------------------------------------------------------ */

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardBadge,
  CardMetric,
  Tabs,
  TabContent,
  TabStats,
  TabChart,
}