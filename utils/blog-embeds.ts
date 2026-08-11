/**
 * Embed rules for post markdown, enforced when a post is saved.
 *
 * Posts embed YouTube by pasting the snippet YouTube hands out, and that
 * snippet carries `width="720" height="405"`. A fixed pixel width is wider than
 * a phone viewport, so the embed pushes the whole document sideways — one
 * hard-coded attribute gives every reader a horizontal scrollbar.
 *
 * Sizing lives in one place: `.prose iframe` in assets/css/tailwind.css renders
 * every embed at column width and 16:9. These checks used to be a test that
 * scanned `content/blogs/*.md`; now that posts are written in a textarea and
 * saved straight to Firestore, the check has to run at save time instead.
 */

const IFRAME_RX = /<iframe\b[^>]*>/gi

export function findIframes(markdown: string): string[] {
  return markdown.match(IFRAME_RX) ?? []
}

/** Human-readable problems, one per offending embed. Empty means the post is fine. */
export function findEmbedProblems(markdown: string): string[] {
  const problems: string[] = []

  for (const tag of findIframes(String(markdown ?? ''))) {
    const excerpt = tag.slice(0, 90)

    if (/\s(?:width|height)\s*=/i.test(tag))
      problems.push(`Embed has a width/height attribute — let the CSS size it: ${excerpt}`)

    // A percentage width is fine — it still tracks the column. Anything else
    // that starts with a number is a fixed size and defeats the CSS.
    const style = tag.match(/style\s*=\s*"([^"]*)"/i)?.[1] ?? ''
    const width = style.match(/\bwidth\s*:\s*([^;]+)/i)?.[1]?.trim() ?? ''
    if (/^\d/.test(width) && !width.endsWith('%'))
      problems.push(`Embed has a fixed inline width — let the CSS size it: ${excerpt}`)

    if (!/\stitle\s*=/i.test(tag))
      problems.push(`Embed has no title attribute — screen readers need one: ${excerpt}`)
  }

  return problems
}
