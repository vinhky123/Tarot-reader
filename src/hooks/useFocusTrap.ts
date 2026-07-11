import { useEffect, type RefObject } from 'react'

/**
 * Trap keyboard focus inside a container (for modal dialogs).
 *
 * - On mount, moves focus into the first focusable element in the container.
 * - Tabs cycle within the container (Tab on the last element wraps to the
 *   first, Shift+Tab on the first wraps to the last).
 * - Escape calls `onEscape` if provided.
 * - On cleanup, focus is returned to the element that was focused before the
 *   trap activated (so the trigger button regains focus when the dialog
 *   closes).
 *
 * No external dependency — pure DOM + React.
 */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
) {
  useEffect(() => {
    if (!active) return
    const refEl = containerRef.current
    if (!refEl) return
    // Bind to a const so the closure keeps the narrowed type.
    const container: HTMLElement = refEl

    const previouslyFocused = document.activeElement as HTMLElement | null

    // Move focus into the dialog.
    const focusables = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null)

    const initial = focusables()[0]
    if (initial) initial.focus()

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onEscape?.()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const activeEl = document.activeElement
      if (e.shiftKey) {
        if (activeEl === first || !container.contains(activeEl)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (activeEl === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKey)
    return () => {
      container.removeEventListener('keydown', handleKey)
      // Restore focus to the trigger.
      previouslyFocused?.focus?.()
    }
  }, [containerRef, active, onEscape])
}
