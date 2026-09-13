/**
 * Shim de tipos: Metro resuelve './adapters' a adapters.native.ts o
 * adapters.web.ts por extension de plataforma en runtime; TypeScript (que no
 * entiende extensiones de plataforma) resuelve a este fichero. Ambos
 * variantes exportan los mismos simbolos: si difieren, el typecheck avisa.
 */
export * from './adapters.native'
