const { withGradleProperties } = require('expo/config-plugins')

/**
 * Config plugin (F5): limita las ABIs empaquetadas en el APK.
 *
 * Sin filtro, el APK universal trae 4 ABIs (x86/x86_64 de emulador +
 * armeabi-v7a + arm64-v8a) y supera los 100MB. Con `arm64-v8a` queda en
 * ~45-55MB.
 *
 * OJO: escribir `ndk { abiFilters }` en app/build.gradle NO sirve — el
 * plugin de Gradle de React Native lo sobrescribe con la propiedad
 * `reactNativeArchitectures`. Este plugin fija esa propiedad en
 * `android/gradle.properties`, que es el mecanismo oficial de RN.
 *
 * - `ALETHEIA_ABIS`: lista explicita (coma o espacio, p. ej. "arm64-v8a").
 *   Tiene prioridad sobre el perfil.
 * - Perfil EAS `preview`: `arm64-v8a` (telefonos fisicos actuales).
 * - development/production/sin perfil: sin filtro (el emulador x86_64 lo
 *   necesita; el AAB de production deja que Play genere splits por ABI).
 */
module.exports = function withAndroidAbiFilter(config) {
  return withGradleProperties(config, (mod) => {
    const profile = process.env.EAS_BUILD_PROFILE
    const explicit = process.env.ALETHEIA_ABIS
    const abis =
      explicit != null && explicit.trim() !== ''
        ? explicit.split(/[\s,]+/).filter((a) => a.length > 0)
        : profile === 'preview'
          ? ['arm64-v8a']
          : []
    console.log(
      `[android-abi-filter] profile=${profile ?? '(sin definir)'} abis=${abis.length > 0 ? abis.join(',') : '(todas)'}`,
    )
    if (abis.length === 0) return mod
    const value = abis.join(',')
    const prev = mod.modResults.findIndex((item) => item.type === 'property' && item.key === 'reactNativeArchitectures')
    if (prev >= 0) {
      mod.modResults[prev].value = value
      console.log(`[android-abi-filter] reactNativeArchitectures actualizado: ${value}`)
    } else {
      mod.modResults.push({ type: 'property', key: 'reactNativeArchitectures', value })
      console.log(`[android-abi-filter] reactNativeArchitectures fijado: ${value}`)
    }
    return mod
  })
}
