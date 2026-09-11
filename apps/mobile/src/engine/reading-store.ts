import type { FileSystemPort } from '@aletheia/module-engine'

/** Posicion de lectura persistente por (modulo, libro, capitulo) — spec reader. */
export interface ReadingPosition {
  moduleId: string
  osisCode: string
  chapter: number
}

export interface Bookmark {
  moduleId: string
  osisCode: string
  chapter: number
  verse: number
  verseEnd?: number | undefined
  createdAt: number
}

const POSITION_FILE = 'reading-position.json'
const BOOKMARKS_FILE = 'bookmarks.json'

export function bookmarkKey(b: Pick<Bookmark, 'moduleId' | 'osisCode' | 'chapter' | 'verse'>): string {
  return `${b.moduleId}|${b.osisCode}|${String(b.chapter)}|${String(b.verse)}`
}

async function readJson(fs: FileSystemPort, sandboxDir: string, file: string): Promise<unknown> {
  const bytes = await fs.readFile(`${sandboxDir}/${file}`)
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown
}

async function writeJson(fs: FileSystemPort, sandboxDir: string, file: string, value: unknown): Promise<void> {
  await fs.writeFile(`${sandboxDir}/${file}`, new TextEncoder().encode(JSON.stringify(value)))
}

function isPosition(value: unknown): value is ReadingPosition {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.moduleId === 'string' &&
    typeof v.osisCode === 'string' &&
    Number.isInteger(v.chapter) &&
    (v.chapter as number) >= 1
  )
}

function isBookmark(value: unknown): value is Bookmark {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.moduleId === 'string' &&
    typeof v.osisCode === 'string' &&
    Number.isInteger(v.chapter) &&
    Number.isInteger(v.verse)
  )
}

export async function loadReadingPosition(
  fs: FileSystemPort,
  sandboxDir: string,
): Promise<ReadingPosition | null> {
  try {
    const value = await readJson(fs, sandboxDir, POSITION_FILE)
    return isPosition(value) ? value : null
  } catch {
    return null
  }
}

export async function saveReadingPosition(
  fs: FileSystemPort,
  sandboxDir: string,
  position: ReadingPosition,
): Promise<void> {
  try {
    await writeJson(fs, sandboxDir, POSITION_FILE, position)
  } catch {
    // La posicion es best-effort: nunca debe romper la lectura.
  }
}

export async function loadBookmarks(fs: FileSystemPort, sandboxDir: string): Promise<Bookmark[]> {
  try {
    const value = await readJson(fs, sandboxDir, BOOKMARKS_FILE)
    if (!Array.isArray(value)) return []
    return value.filter(isBookmark)
  } catch {
    return []
  }
}

export async function saveBookmarks(
  fs: FileSystemPort,
  sandboxDir: string,
  bookmarks: Bookmark[],
): Promise<void> {
  try {
    await writeJson(fs, sandboxDir, BOOKMARKS_FILE, bookmarks)
  } catch {
    // Best-effort igual que la posicion.
  }
}
