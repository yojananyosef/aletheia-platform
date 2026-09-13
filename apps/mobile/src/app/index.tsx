import { Redirect } from 'expo-router'

/**
 * Ruta inicial (F5): "/" redirige a la tab por defecto. Sin este index, el
 * arranque en frio de un build release resuelve la URL inicial `aletheia:///`
 * contra ningun fichero y muestra "Unmatched Route" (reproducido en emulador
 * con el APK preview: el deep-link a /biblioteca si renderizaba bien).
 */
export default function Index() {
  return <Redirect href="/inicio" />
}
