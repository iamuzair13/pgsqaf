/**
 * Shared Framer Motion presets (CONTEXT.md §6.7).
 *
 * Motion answers an action or explains a change — it doesn't decorate.
 * Import presets from here instead of hand-rolling transitions, so motion
 * stays quiet and consistent. All presets respect MotionConfig's
 * reducedMotion="user" in providers.
 */

export const ease = [0.22, 1, 0.36, 1] as const // easeOutExpo-like

export const t = {
  fast: { duration: 0.14, ease },
  base: { duration: 0.22, ease },
  slow: { duration: 0.5, ease },
  spring: { type: "spring", stiffness: 420, damping: 34 },
} as const

/** Dialogs, popovers, small entrances — fade + 8px rise. */
export const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: t.base },
  exit: { opacity: 0, y: 4, transition: t.fast },
}

/** Wizard step change — content slides 12px in the direction of travel. */
export const stepSlide = (dir: 1 | -1) => ({
  initial: { opacity: 0, x: 12 * dir },
  animate: { opacity: 1, x: 0, transition: t.base },
  exit: { opacity: 0, x: -12 * dir, transition: t.fast },
})

/** Parent that staggers children — dashboards, result breakdowns. */
export const stagger = (gap = 0.05) => ({
  show: { transition: { staggerChildren: gap } },
})

/** Single opacity cross-fade — route transitions, autosave status text. */
export const fade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: t.fast },
  exit: { opacity: 0, transition: t.fast },
}

/** Score ring draw — the one big moment (900 ms, once, on submit success). */
export const RING_DRAW_MS = 900
