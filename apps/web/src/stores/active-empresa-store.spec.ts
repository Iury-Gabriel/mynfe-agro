import { beforeEach, describe, expect, it } from 'vitest'

import { ACTIVE_EMPRESA_STORAGE_KEY } from '@/lib/active-empresa'
import { useActiveEmpresaStore } from '@/stores/active-empresa-store'

describe('useActiveEmpresaStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useActiveEmpresaStore.setState({ activeEmpresaId: null })
  })

  it('setActiveEmpresaId atualiza o estado e persiste no storage', () => {
    useActiveEmpresaStore.getState().setActiveEmpresaId('e-1')

    expect(useActiveEmpresaStore.getState().activeEmpresaId).toBe('e-1')
    expect(window.localStorage.getItem(ACTIVE_EMPRESA_STORAGE_KEY)).toBe('e-1')
  })

  it('setActiveEmpresaId(null) limpa o estado e o storage', () => {
    useActiveEmpresaStore.getState().setActiveEmpresaId('e-1')
    useActiveEmpresaStore.getState().setActiveEmpresaId(null)

    expect(useActiveEmpresaStore.getState().activeEmpresaId).toBeNull()
    expect(window.localStorage.getItem(ACTIVE_EMPRESA_STORAGE_KEY)).toBeNull()
  })
})
