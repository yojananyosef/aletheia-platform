const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')
const { withUniwindConfig } = require('uniwind/metro')

const config = getDefaultConfig(__dirname)

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
config.resolver.assetExts.push('wasm')

// @sqlite.org/sqlite-wasm referencia su worker via `new URL('sqlite3-worker1.mjs',
// import.meta.url)`, que Metro no resuelve solo: se mapea al fichero real del
// paquete. Solo se usa si se crean workers (no es nuestro caso: SQLite corre en
// el hilo principal via adapters.web.ts); basta con que el bundle resuelva.
const sqliteWasmDist = path.resolve(
  projectRoot,
  'node_modules/@sqlite.org/sqlite-wasm/dist',
)
const defaultResolveRequest =
  config.resolver.resolveRequest ??
  ((context, moduleName, platform) => context.resolveRequest(context, moduleName, platform))
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'sqlite3-worker1.mjs') {
    return {
      filePath: path.join(sqliteWasmDist, 'sqlite3-worker1.mjs'),
      type: 'sourceFile',
    }
  }
  return defaultResolveRequest(context, moduleName, platform)
}

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
  extraThemes: ['pergamino', 'sepia', 'noche'],
})
