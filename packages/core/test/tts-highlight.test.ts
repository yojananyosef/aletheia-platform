import { describe, expect, test } from 'bun:test'
import { findWordIndexAtOffset, pickVoiceId, splitWords } from '../src/tts/highlight'

describe('splitWords', () => {
  test('divide con offsets exactos y colapsa espacios multiples', () => {
    expect(splitWords('In the beginning')).toEqual([
      { word: 'In', start: 0, length: 2 },
      { word: 'the', start: 3, length: 3 },
      { word: 'beginning', start: 7, length: 9 },
    ])
    expect(splitWords('  God   created ')).toEqual([
      { word: 'God', start: 2, length: 3 },
      { word: 'created', start: 8, length: 7 },
    ])
    expect(splitWords('')).toEqual([])
  })
})

describe('findWordIndexAtOffset', () => {
  const text = 'In the beginning'
  test('mapea charIndex de boundary a la palabra en curso', () => {
    expect(findWordIndexAtOffset(text, 0)).toBe(0)
    expect(findWordIndexAtOffset(text, 1)).toBe(0)
    expect(findWordIndexAtOffset(text, 3)).toBe(1)
    expect(findWordIndexAtOffset(text, 8)).toBe(2)
    expect(findWordIndexAtOffset(text, 15)).toBe(2)
  })

  test('offsets fuera de rango o huecos resuelven sin romper', () => {
    expect(findWordIndexAtOffset(text, -1)).toBe(-1)
    expect(findWordIndexAtOffset(text, 16)).toBe(-1)
    expect(findWordIndexAtOffset('', 0)).toBe(-1)
    // hueco de espacio entre "In" y "the" -> palabra anterior
    expect(findWordIndexAtOffset(text, 2)).toBe(0)
  })
})

describe('pickVoiceId', () => {
  const voices = [
    { identifier: 'en-1', language: 'en-US' },
    { identifier: 'en-2', language: 'en-GB' },
    { identifier: 'es-1', language: 'es-ES' },
    { identifier: 'es-2', language: 'es-MX' },
  ]
  test('exacta antes que prefijo; prefijo antes que nada', () => {
    expect(pickVoiceId(voices, ['es-MX'])).toBe('es-2')
    expect(pickVoiceId(voices, ['es'])).toBe('es-1')
    expect(pickVoiceId(voices, ['fr-FR', 'es'])).toBe('es-1')
    expect(pickVoiceId(voices, ['fr'])).toBeUndefined()
    expect(pickVoiceId([], ['es'])).toBeUndefined()
  })

  test('case-insensitive y guion/underscore equivalentes', () => {
    expect(pickVoiceId([{ identifier: 'a', language: 'es_MX' }], ['ES-mx'])).toBe('a')
  })
})
