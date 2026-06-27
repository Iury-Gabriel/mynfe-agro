export const ACTIVE_EMPRESA_HEADER = 'x-active-empresa-id'
export const ACTIVE_EMPRESA_STORAGE_KEY = 'agroflow.active-empresa-id'

export function getActiveEmpresaId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_EMPRESA_STORAGE_KEY)
  } catch {
    return null
  }
}

export function persistActiveEmpresaId(id: string | null): void {
  try {
    if (id) {
      window.localStorage.setItem(ACTIVE_EMPRESA_STORAGE_KEY, id)
    } else {
      window.localStorage.removeItem(ACTIVE_EMPRESA_STORAGE_KEY)
    }
  } catch {
    // localStorage indisponível (modo privado/SSR) — header simplesmente não viaja.
  }
}
