import { describe, expect, test } from 'bun:test'
import type { FileSystemPort } from '@aletheia/module-engine'
import {
  bookmarkKey,
  loadBookmarks,
  loadReadingPosition,
  saveBookmarks,
  saveReadingPosition,
  type Bookmark,
} from './reading-store'

function memoryFs(): { fs: FileSystemPort; files: Map<string, Uint8Array> } {
  const files = new Map<string, Uint8Array>()
  const fs: FileSystemPort = {
    async exists(path) {
      return files.has(path)
    },
    async mkdir() {},
    async writeFile(path, data) {
      files.set(path, data)
    },
    async readFile(path) {
      const data = files.get(path)
      if (!data) throw new Error(`no existe ${path}`)
      return data
    },
    async rm(path) {
      files.delete(path)
    },
    async listDir() {
      return []
    },
  }
  return { fs, files }
}

const DIR = '/sandbox'

describe('reading-store', () => {
  test('posicion inexistente -> null; roundtrip la restaura', async () => {
    const { fs } = memoryFs()
    expect(await loadReadingPosition(fs, DIR)).toBeNull()
    await saveReadingPosition(fs, DIR, { moduleId: 'asv', osisCode: 'Gen', chapter: 3 })
    expect(await loadReadingPosition(fs, DIR)).toEqual({ moduleId: 'asv', osisCode: 'Gen', chapter: 3 })
  })

  test('posicion corrupta o invalida -> null', async () => {
    const { fs, files } = memoryFs()
    files.set(`${DIR}/reading-position.json`, new TextEncoder().encode('no-json'))
    expect(await loadReadingPosition(fs, DIR)).toBeNull()
    files.set(
      `${DIR}/reading-position.json`,
      new TextEncoder().encode(JSON.stringify({ moduleId: 'asv', chapter: 0 })),
    )
    expect(await loadReadingPosition(fs, DIR)).toBeNull()
  })

  test('marcadores: roundtrip y clave unica por pasaje', async () => {
    const { fs } = memoryFs()
    expect(await loadBookmarks(fs, DIR)).toEqual([])
    const marks: Bookmark[] = [
      { moduleId: 'asv', osisCode: 'Gen', chapter: 1, verse: 1, createdAt: 1 },
      { moduleId: 'asv', osisCode: 'Gen', chapter: 1, verse: 3, verseEnd: 5, createdAt: 2 },
    ]
    await saveBookmarks(fs, DIR, marks)
    expect(await loadBookmarks(fs, DIR)).toEqual(marks)
    expect(bookmarkKey(marks[0] as Bookmark)).toBe('asv|Gen|1|1')
    expect(bookmarkKey(marks[0] as Bookmark)).not.toBe(bookmarkKey(marks[1] as Bookmark))
  })

  test('marcadores corruptos o con entradas invalidas se filtran', async () => {
    const { fs, files } = memoryFs()
    files.set(
      `${DIR}/bookmarks.json`,
      new TextEncoder().encode(
        JSON.stringify([
          { moduleId: 'asv', osisCode: 'Gen', chapter: 1, verse: 1 },
          { moduleId: 'asv', chapter: 1, verse: 2 },
          'basura',
        ]),
      ),
    )
    expect(await loadBookmarks(fs, DIR)).toEqual([
      { moduleId: 'asv', osisCode: 'Gen', chapter: 1, verse: 1 },
    ])
  })

  test('guardar nunca lanza aunque el fs falle', async () => {
    const { fs } = memoryFs()
    const failing: FileSystemPort = {
      ...fs,
      async writeFile() {
        throw new Error('disco lleno')
      },
    }
    await saveReadingPosition(failing, DIR, { moduleId: 'asv', osisCode: 'Gen', chapter: 1 })
    await saveBookmarks(failing, DIR, [])
  })
})
