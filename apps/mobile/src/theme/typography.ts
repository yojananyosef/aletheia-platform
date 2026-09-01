import type { FontFamilyId } from '@aletheia/core'

/** Family names registrados con expo-font (src/app/_layout.tsx). */
export const FONT_FAMILY_NAMES: Record<FontFamilyId, string | undefined> = {
  system: undefined,
  opendyslexic: 'OpenDyslexic',
  atkinson: 'AtkinsonHyperlegible',
  literata: 'Literata',
}
