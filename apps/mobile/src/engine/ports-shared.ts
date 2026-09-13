import * as Crypto from 'expo-crypto'

import type { CryptoPort, HttpPort } from '@aletheia/module-engine'

/**
 * Puertos compartidos nativo+web: expo-crypto funciona en web (SubtleCrypto) y
 * fetch es universal. Lo que difiere por plataforma (fs/sqlite) vive en
 * adapters.native.ts y adapters.web.ts (Metro resuelve por extension).
 */
export function createCryptoPort(): CryptoPort {
  return {
    async sha256Hex(data: Uint8Array): Promise<string> {
      const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, new Uint8Array(data))
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    },
  }
}

export function createHttpPort(): HttpPort {
  return {
    async getBinary(url: string): Promise<Uint8Array> {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${String(res.status)} descargando ${url}`)
      return new Uint8Array(await res.arrayBuffer())
    },
    async getJson<T>(url: string): Promise<T> {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${String(res.status)} descargando ${url}`)
      return (await res.json()) as T
    },
  }
}
