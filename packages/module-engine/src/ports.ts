/**
 * Puertos de plataforma. El engine es agnostico: la app movil inyecta adaptadores
 * expo (expo-file-system/expo-crypto/expo-sqlite) y los tests adaptadores node/bun.
 */
export interface FileSystemPort {
  exists(path: string): Promise<boolean>
  mkdir(path: string): Promise<void>
  writeFile(path: string, data: Uint8Array): Promise<void>
  readFile(path: string): Promise<Uint8Array>
  /** Elimina el path recursivamente; no falla si no existe. */
  rm(path: string): Promise<void>
  listDir(path: string): Promise<string[]>
}

export interface CryptoPort {
  sha256Hex(data: Uint8Array): Promise<string>
}

export interface SqliteDb {
  get<T = unknown>(sql: string, params?: ReadonlyArray<string | number | null>): Promise<T | undefined>
  all<T = unknown>(sql: string, params?: ReadonlyArray<string | number | null>): Promise<T[]>
  close(): Promise<void>
}

export interface SqlitePort {
  /** Abre el content.db del modulo en modo inmutable (solo lectura, sin journal). */
  openReadOnly(path: string): Promise<SqliteDb>
}

export interface HttpPort {
  getBinary(url: string): Promise<Uint8Array>
  getJson<T>(url: string): Promise<T>
}

export interface EnginePorts {
  fs: FileSystemPort
  crypto: CryptoPort
  sqlite: SqlitePort
  http: HttpPort
}
