import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ACTIVE_EMPRESA_HEADER,
  ACTIVE_EMPRESA_STORAGE_KEY,
  getActiveEmpresaId,
  persistActiveEmpresaId,
} from './active-empresa'

describe('active-empresa', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('expõe a constante do header', () => {
    expect(ACTIVE_EMPRESA_HEADER).toBe('x-active-empresa-id')
  })

  it('lê o id persistido do storage', () => {
    window.localStorage.setItem(ACTIVE_EMPRESA_STORAGE_KEY, 'e-1')
    expect(getActiveEmpresaId()).toBe('e-1')
  })

  it('retorna null quando não há id', () => {
    expect(getActiveEmpresaId()).toBeNull()
  })

  it('retorna null quando o getItem lança', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(getActiveEmpresaId()).toBeNull()
  })

  it('persiste o id informado', () => {
    persistActiveEmpresaId('e-2')
    expect(window.localStorage.getItem(ACTIVE_EMPRESA_STORAGE_KEY)).toBe('e-2')
  })

  it('remove o id quando recebe null', () => {
    window.localStorage.setItem(ACTIVE_EMPRESA_STORAGE_KEY, 'e-3')
    persistActiveEmpresaId(null)
    expect(window.localStorage.getItem(ACTIVE_EMPRESA_STORAGE_KEY)).toBeNull()
  })

  it('engole o erro quando setItem lança', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => persistActiveEmpresaId('e-4')).not.toThrow()
  })

  it('engole o erro quando removeItem lança', () => {
    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => persistActiveEmpresaId(null)).not.toThrow()
  })
})
