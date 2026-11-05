/**
 * The "quiz()" wordmark with its eyebrow label.
 * `compact` is the smaller version used at the top of the quiz page; the main page uses the
 * full-size version as its <h1>.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  const Title = compact ? 'p' : 'h1'

  return (
    <div className={compact ? 'logo logo--compact' : 'logo'}>
      <p className="logo-eyebrow">Software Engineer</p>
      <Title className="logo-title">
        quiz<span className="logo-parens">()</span>
      </Title>
    </div>
  )
}
