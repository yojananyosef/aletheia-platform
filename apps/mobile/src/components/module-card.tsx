import { Pressable, Text, View } from 'react-native'

import type { CatalogModule, InstalledModule } from '@aletheia/module-engine'

const TYPE_LABELS: Record<CatalogModule['type'], string> = {
  bible: 'Biblia',
  commentary: 'Comentario',
  lexicon: 'Léxico',
  dictionary: 'Diccionario',
  crossref: 'Referencias',
  devotion: 'Devocional',
}

export function formatSizeBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${String(Math.max(1, Math.round(bytes / 1024)))} KB`
}

interface ModuleCardProps {
  module: CatalogModule
  installed: InstalledModule | undefined
  busy: boolean
  onInstall(module: CatalogModule): void
  onRemove(id: string): void
}

export function ModuleCard({ module, installed, busy, onInstall, onRemove }: ModuleCardProps) {
  const canUpdate =
    installed !== undefined &&
    (installed.version !== module.version || !installed.enabled)
  return (
    <View className="gap-3 rounded-2xl border border-reader-border p-4">
      <View className="flex-row items-center gap-2">
        <View className="rounded-full bg-accent-subtle px-2.5 py-1">
          <Text className="text-xs font-semibold text-reader-text">
            {TYPE_LABELS[module.type]}
          </Text>
        </View>
        <Text className="text-xs text-reader-muted">
          {module.language} · v{module.version} · {formatSizeBytes(module.sizeBytes)}
        </Text>
      </View>

      <View className="gap-1">
        <Text className="text-lg font-bold text-reader-text">{module.name}</Text>
        <Text className="text-sm text-reader-muted">
          {module.publisher}
          {module.source ? ` · ${module.source}` : ''}
        </Text>
      </View>

      <View className="gap-0.5 rounded-xl bg-hover p-3">
        <Text className="text-xs text-reader-text">Licencia: {module.license}</Text>
        <Text className="text-xs text-reader-muted">Attribution: {module.attribution}</Text>
        <Text className="text-xs text-reader-muted">© {module.copyright}</Text>
      </View>

      {installed !== undefined && !canUpdate ? (
        <View className="flex-row items-center gap-2">
          <View className="min-h-[44px] flex-1 items-center justify-center rounded-xl bg-accent-subtle px-4">
            <Text className="text-sm font-semibold text-reader-text">
              Instalado v{installed.version}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Eliminar ${module.name}`}
            disabled={busy}
            onPress={() => onRemove(module.id)}
            className="min-h-[44px] justify-center rounded-xl border border-reader-border px-4 active:bg-hover disabled:opacity-50"
          >
            <Text className="text-sm font-semibold text-reader-text">Eliminar</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            installed !== undefined ? `Actualizar ${module.name}` : `Instalar ${module.name}`
          }
          disabled={busy}
          onPress={() => onInstall(module)}
          className="min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 active:bg-hover disabled:opacity-50"
        >
          <Text className="text-sm font-semibold text-accent-fg">
            {busy
              ? 'Descargando y verificando…'
              : installed !== undefined
                ? `Actualizar a v${module.version}`
                : 'Instalar'}
          </Text>
        </Pressable>
      )}
    </View>
  )
}
