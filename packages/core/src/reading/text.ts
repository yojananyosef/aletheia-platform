/**
 * Transformaciones de texto del lector (F2): lectura bionica y puntos
 * silabicos. TS puro y agnostico a la plataforma — la app movil las
 * renderiza con <Text> anidados; aqui solo se segmenta texto.
 */

export interface BionicSegment {
  text: string
  /** el "ancla" inicial que el ojo fija (renderizar en negrita) */
  strong: boolean
}

const LETTER_RUN = /[\p{L}]+/gu

function bionicSplit(word: string): BionicSegment[] {
  const chars = [...word]
  const strongCount = Math.max(1, Math.ceil(chars.length / 2))
  return [
    { text: chars.slice(0, strongCount).join(''), strong: true },
    ...(strongCount < chars.length
      ? [{ text: chars.slice(strongCount).join(''), strong: false as const }]
      : []),
  ]
}

/**
 * Divide un texto en segmentos bionicos: cada racha de letras aporta su
 * mitad inicial como ancla; espacios y puntuacion quedan sin resaltar.
 */
export function toBionicSegments(text: string): BionicSegment[] {
  const out: BionicSegment[] = []
  let cursor = 0
  for (const match of text.matchAll(LETTER_RUN)) {
    const start = match.index ?? cursor
    if (start > cursor) out.push({ text: text.slice(cursor, start), strong: false })
    out.push(...bionicSplit(match[0] ?? ''))
    cursor = start + (match[0]?.length ?? 0)
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), strong: false })
  return out.filter((s) => s.text.length > 0)
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'á', 'é', 'í', 'ó', 'ú', 'ü'])
const STRONG_VOWELS = new Set(['a', 'e', 'o', 'á', 'é', 'ó'])
const HIATUS_WEAK = new Set(['í', 'ú'])
const ONSET_LIQUIDS = new Set(['l', 'r'])
const ONSET_GROUP_FIRST = new Set(['p', 'b', 't', 'd', 'c', 'g', 'f'])

/** 'y' es vocal salvo ante vocal (ya/yerno la usan como consonante). */
function isVowelAt(chars: string[], i: number): boolean {
  const c = chars[i]?.toLowerCase() ?? ''
  if (VOWELS.has(c)) return true
  if (c !== 'y') return false
  const next = chars[i + 1]?.toLowerCase()
  if (next === undefined) return true
  if (VOWELS.has(next) || next === 'y') return false
  return true
}

function isStrongVowel(lowered: string): boolean {
  return STRONG_VOWELS.has(lowered)
}

/**
 * Silabea una palabra en espanol con reglas deterministicas:
 * diptongos (fuerte+debil, debil+debil) y triptongos en un nucleo; hiatos
 * (fuerte+fuerte, i/u acentuadas) separados; 'h' muda transparente para el
 * agrupamiento pero conservada en su silaba; digrafos ch/ll/rr
 * inseparables; grupos pr/br/tr/dr/cr/gr/fr/pl/bl/cl/gl/fl como ataque
 * (tl se separa: at-las, norma peninsular); resto de grupos se corta
 * antes de la ultima consonante (trans-por-te, ex-tra).
 * Conserva las mayusculas y tildes originales.
 */
export function splitSyllablesES(word: string): string[] {
  const chars = [...word]
  const n = chars.length
  if (n === 0) return []
  const vowel = chars.map((_, i) => isVowelAt(chars, i))
  if (!vowel.includes(true)) return [word]

  interface Nucleus {
    start: number
    end: number
  }
  const nuclei: Nucleus[] = []
  let i = 0
  while (i < n) {
    if (!vowel[i] && chars[i]?.toLowerCase() !== 'h') {
      i += 1
      continue
    }
    // Racha maximal de vocales + haches con al menos una vocal.
    let j = i
    while (j < n && (vowel[j] || chars[j]?.toLowerCase() === 'h')) j += 1
    const vowelIdx: number[] = []
    for (let k = i; k < j; k += 1) if (vowel[k]) vowelIdx.push(k)
    // Agrupa vocales en nucleos; las haches entre dos vocales de grupos
    // distintos abren el grupo derecho (a-ho-ra, al-co-hol) y las haches
    // tras la ultima vocal cierran su nucleo.
    let gStart = i
    let prev = vowelIdx[0] ?? -1
    const closeNucleus = (lastVowel: number, nextVowel: number | undefined) => {
      let end = lastVowel
      if (nextVowel === undefined) {
        while (end + 1 < j && chars[end + 1]?.toLowerCase() === 'h') end += 1
      }
      nuclei.push({ start: gStart, end })
      if (nextVowel !== undefined) gStart = lastVowel + 1
    }
    for (let v = 1; v < vowelIdx.length; v += 1) {
      const cur = vowelIdx[v] ?? prev
      const pl = chars[prev]?.toLowerCase() ?? ''
      const cl = chars[cur]?.toLowerCase() ?? ''
      const hiatus =
        HIATUS_WEAK.has(pl) || HIATUS_WEAK.has(cl) || (isStrongVowel(pl) && isStrongVowel(cl))
      if (hiatus) {
        closeNucleus(prev, cur)
        prev = cur
      } else {
        prev = cur
      }
    }
    closeNucleus(prev, undefined)
    i = j
  }

  // Punto de corte de cada grupo consonantico entre nucleos.
  const splits: number[] = []
  for (let g = 0; g + 1 < nuclei.length; g += 1) {
    const left = nuclei[g]?.end ?? 0
    const right = nuclei[g + 1]?.start ?? n
    const cluster = chars.slice(left + 1, right).map((c) => c.toLowerCase())
    splits.push(onsetStart(left + 1, cluster))
  }

  const out: string[] = []
  let start = 0
  for (const s of splits) {
    out.push(chars.slice(start, s).join(''))
    start = s
  }
  out.push(chars.slice(start).join(''))
  return out.filter((s) => s.length > 0)
}

/** Indice absoluto donde empieza el ataque (lo que va a la derecha). */
function onsetStart(clusterStart: number, cluster: string[]): number {
  const units = splitDigraphs(cluster)
  if (units.length === 0) return clusterStart
  if (units.length >= 2) {
    const a = units[units.length - 2]
    const b = units[units.length - 1]
    // Grupos inseparables pr/br/tr/dr/cr/gr/fr/pl/bl/cl/gl/fl.
    // tl/dl se separan (at-las, norma peninsular; RAE DPD s.v. atlas).
    const dentalL = (a === 't' || a === 'd') && b === 'l'
    if (
      a !== undefined &&
      b !== undefined &&
      a.length === 1 &&
      b.length === 1 &&
      !dentalL &&
      ONSET_GROUP_FIRST.has(a) &&
      ONSET_LIQUIDS.has(b)
    ) {
      return clusterStart + cluster.length - 2
    }
  }
  const last = units[units.length - 1] ?? ''
  return clusterStart + cluster.length - last.length
}

/** Agrupa ch/ll/rr como unidades inseparables dentro de un grupo. */
function splitDigraphs(cluster: string[]): string[] {
  const units: string[] = []
  let k = 0
  while (k < cluster.length) {
    const pair = (cluster[k] ?? '') + (cluster[k + 1] ?? '')
    if (pair === 'ch' || pair === 'll' || pair === 'rr') {
      units.push(pair)
      k += 2
    } else {
      units.push(cluster[k] ?? '')
      k += 1
    }
  }
  return units
}

/**
 * Aplica puntos silabicos a cada palabra del texto conservando espacios
 * y puntuacion ("En el principio" -> "En el prin·ci·pio").
 */
export function toSyllabicText(text: string, separator = '·'): string {
  return text.replace(LETTER_RUN, (word) => splitSyllablesES(word).join(separator))
}
