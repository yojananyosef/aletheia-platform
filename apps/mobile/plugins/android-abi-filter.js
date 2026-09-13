const { withAppBuildGradle } = require('expo/config-plugins')

/**
 * Config plugin (F5): limita las ABIs empaquetadas en el APK.
 *
 * Sin filtro, el APK universal trae 4 ABIs (x86/x86_64 de emulador +
 * armeabi-v7a + arm64-v8a) y supera los 100MB. Con `arm64-v8a` queda en
 * ~45-55MB.
 *
 * - `ALETHEIA_ABIS`: lista explicita (coma o espacio, p. ej. "arm64-v8a" o
 *   "arm64-v8a x86_64"). Tiene prioridad sobre el perfil.
 * - Perfil EAS `preview`: `arm64-v8a` (telefonos fisicos actuales).
 * - development/production/sin perfil: sin filtro (el emulador x86_64 lo
 *   necesita; el AAB de production deja que Play genere splits por ABI).
 */
module.exports = function withAndroidAbiFilter(config) {
  return withAppBuildGradle(config, (mod) => {
    const profile = process.env.EAS_BUILD_PROFILE
    const explicit = process.env.ALETHEIA_ABIS
    const abis = explicit != null && explicit.trim() !== ''
      ? explicit.split(/[\s,]+/).filter((a) => a.length > 0)
      : profile === 'preview'
        ? ['arm64-v8a']
        : []
    console.log(`[android-abi-filter] profile=${profile ?? '(unset)'} abis=${abis.length > 0 ? abis.join(',') : '(todas)'}`)
    if (abis.length > 0) {
      if (mod.modResults.contents.includes('abiFilters')) {
        console.log('[android-abi-filter] el template ya trae abiFilters: sin cambios')
      } else {
        const list = abis.map((a) => `'${a}'`).join(', ')
        mod.modResults.contents = mod.modResults.contents.replace(
          /defaultConfig\s*\{/,
          `defaultConfig {\n        ndk {\n            abiFilters ${list}\n        }`,
        )
        console.log(`[android-abi-filter] abiFilters inyectado: ${list}`)
      }
    }
    return mod
  })
}
