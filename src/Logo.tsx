/**
 * The "quiz()" wordmark with its eyebrow label.
 * The main page renders it as its <h1>; the quiz page passes `heading={false}` since the
 * logo isn't that page's title.
 */
export function Logo({ heading = true }: { heading?: boolean }) {
  const Title = heading ? 'h1' : 'p'

  return (
    <div className="logo">
      <p className="logo-eyebrow">Software Engineer</p>
      <Title className="logo-title">
        quiz<span className="logo-parens">()</span>
      </Title>
    </div>
  )
}
