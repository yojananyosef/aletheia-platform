import type { SqliteDb } from '../ports'

export interface DevotionEntry {
  month: number
  day: number
  title: string
  scripture?: string | undefined
  content: string
}

export interface DevotionDay {
  month: number
  day: number
  title: string
}

/** Lector de modulos type=devotion (SME): devocional del dia para Inicio F4. */
export class DevotionReader {
  constructor(private readonly db: SqliteDb) {}

  async getDay(month: number, day: number): Promise<DevotionEntry | undefined> {
    const row = await this.db.get<{
      month: number
      day: number
      title: string
      scripture: string | null
      content: string
    }>('SELECT month, day, title, scripture, content FROM entries WHERE month = ? AND day = ? LIMIT 1', [
      month,
      day,
    ])
    if (!row) return undefined
    return { ...row, scripture: row.scripture ?? undefined }
  }

  /** Indice del año (366 filas max): mes/dia/titulo para navegar. */
  async listDays(): Promise<DevotionDay[]> {
    return this.db.all<DevotionDay>(
      'SELECT month, day, title FROM entries ORDER BY month, day',
    )
  }
}
