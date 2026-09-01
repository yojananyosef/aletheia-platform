export class CatalogError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CatalogError'
  }
}

export class InstallError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InstallError'
  }
}

export class ModuleOpenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ModuleOpenError'
  }
}
