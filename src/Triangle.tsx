/**
 * Small solid triangle used in place of arrow glyphs on buttons.
 * Inherits the button's text color via `currentColor`; decorative, so hidden from screen readers.
 */
export function Triangle({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      className="triangle-icon"
      viewBox="0 0 10 12"
      width="0.625em"
      height="0.75em"
      aria-hidden="true"
      focusable="false"
    >
      <path d={direction === 'left' ? 'M10 0 L0 6 L10 12 Z' : 'M0 0 L10 6 L0 12 Z'} fill="currentColor" />
    </svg>
  )
}
