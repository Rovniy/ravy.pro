import type { Game } from '~/data/games'
import { platformLabel, releaseMonth, STATUS_LABEL } from '~/data/projects'

// Pure pieces of /games/<slug>/press: the fact sheet, the list of files in the
// ZIP, and the plain-text fact sheet that goes inside it. The page fetches the
// files and zips them in the browser, so nothing here touches the network.

export interface PressFact { label: string, value: string }

/** Facts the game page lists under its own labels; the press kit says them once. */
const STUDIO_LABELS = new Set(['Studio', 'Developer and publisher'])

export function pressFacts(game: Game): PressFact[] {
  const release = game.releaseDate
    ? `${STATUS_LABEL[game.status]} · ${releaseMonth(game.releaseDate)}`
    : STATUS_LABEL[game.status]
  return [
    { label: 'Developer and publisher', value: 'XPLOIT, an independent game studio' },
    { label: 'Release', value: release },
    { label: 'Genre', value: game.genre },
    ...game.facts.filter(f => !STUDIO_LABELS.has(f.label)),
  ]
}

export interface PressFile {
  /** Root-relative path this site serves the file at. */
  path: string
  /** File name inside the ZIP. */
  name: string
  alt: string
}

/**
 * Every image the press kit offers, in display order: icon, cover, screenshots.
 * Hotlinked images (a YouTube thumbnail as a cover) are left out: the browser
 * cannot fetch them for the ZIP, and they are not ours to hand out.
 */
export function pressFiles(game: Game): PressFile[] {
  const files: PressFile[] = []
  const add = (path: string, alt: string) => {
    if (path.startsWith('/'))
      files.push({ path, name: path.split('/').pop()!, alt })
  }
  if (game.icon)
    add(game.icon.src, game.icon.alt)
  add(game.cover.src, game.cover.alt)
  for (const s of game.screenshots ?? [])
    add(s.src, s.alt)
  return files
}

export function pressZipName(game: Pick<Game, 'slug'>): string {
  return `${game.slug}-press-kit.zip`
}

/** fact-sheet.txt inside the ZIP: the whole page as plain text. */
export function factSheetText(game: Game, opts: { site: string, email: string }): string {
  const page = `${opts.site}/games/${game.slug}`
  const lines = [
    `${game.title}: press kit`,
    `${page}/press`,
    '',
    'FACTS',
    ...pressFacts(game).map(f => `${f.label}: ${f.value}`),
    '',
    'SHORT DESCRIPTION',
    game.press.short,
    '',
    'LONG DESCRIPTION',
    game.press.long.join('\n\n'),
  ]
  if (game.trailerYoutubeId)
    lines.push('', 'TRAILER', `https://www.youtube.com/watch?v=${game.trailerYoutubeId}`)
  if (game.links.length)
    lines.push('', 'LINKS', ...game.links.map(l => `${platformLabel(l)}: ${l.url}`))
  lines.push('', 'CONTACT', `Press, creators and partners: ${opts.email}`, `Game page: ${page}`, '')
  return lines.join('\n')
}
