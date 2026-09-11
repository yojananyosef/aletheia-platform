import { describe, expect, test } from 'bun:test'
import { splitSyllablesES, toBionicSegments, toSyllabicText } from '../src/reading/text'

describe('toBionicSegments', () => {
  test('ancla la mitad inicial de cada palabra y conserva separadores', () => {
    expect(toBionicSegments('En el')).toEqual([
      { text: 'E', strong: true },
      { text: 'n', strong: false },
      { text: ' ', strong: false },
      { text: 'e', strong: true },
      { text: 'l', strong: false },
    ])
  })

  test('palabra de una letra queda entera como ancla', () => {
    expect(toBionicSegments('y')).toEqual([{ text: 'y', strong: true }])
  })

  test('puntuacion adjunta no se resalta', () => {
    expect(toBionicSegments('Dios,')).toEqual([
      { text: 'Di', strong: true },
      { text: 'os', strong: false },
      { text: ',', strong: false },
    ])
  })
})

describe('splitSyllablesES', () => {
  const cases: Array<[string, string[]]> = [
    ['casa', ['ca', 'sa']],
    ['Espíritu', ['Es', 'pí', 'ri', 'tu']],
    ['Jesús', ['Je', 'sús']],
    ['Biblia', ['Bi', 'blia']],
    ['creación', ['cre', 'a', 'ción']],
    ['Dios', ['Dios']],
    ['tierra', ['tie', 'rra']],
    ['alcohol', ['al', 'co', 'hol']],
    ['transporte', ['trans', 'por', 'te']],
    ['extraño', ['ex', 'tra', 'ño']],
    ['examen', ['e', 'xa', 'men']],
    ['instrumento', ['ins', 'tru', 'men', 'to']],
    ['oír', ['o', 'ír']],
    ['aún', ['a', 'ún']],
    ['río', ['rí', 'o']],
    ['hay', ['hay']],
    ['buey', ['buey']],
    ['queso', ['que', 'so']],
    ['guerra', ['gue', 'rra']],
    ['muchacho', ['mu', 'cha', 'cho']],
    ['carro', ['ca', 'rro']],
    ['llave', ['lla', 've']],
    ['rancho', ['ran', 'cho']],
    ['año', ['a', 'ño']],
    ['reloj', ['re', 'loj']],
    ['Israel', ['Is', 'ra', 'el']],
    ['hola', ['ho', 'la']],
    ['ahora', ['a', 'ho', 'ra']],
    ['ahijado', ['ahi', 'ja', 'do']],
    ['ayer', ['a', 'yer']],
    ['Uruguay', ['U', 'ru', 'guay']],
    ['principio', ['prin', 'ci', 'pio']],
    ['y', ['y']],
    ['atlas', ['at', 'las']],
  ]
  for (const [word, expected] of cases) {
    test(`${word} -> ${expected.join('·')}`, () => {
      expect(splitSyllablesES(word)).toEqual(expected)
    })
  }

  test('sin vocales devuelve la palabra intacta', () => {
    expect(splitSyllablesES('zzz')).toEqual(['zzz'])
    expect(splitSyllablesES('')).toEqual([])
  })
})

describe('toSyllabicText', () => {
  test('silabea palabras y conserva espacios y puntuacion', () => {
    expect(toSyllabicText('En el principio')).toBe('En el prin·ci·pio')
    expect(toSyllabicText('Dios creó.')).toBe('Dios cre·ó.')
  })
})
