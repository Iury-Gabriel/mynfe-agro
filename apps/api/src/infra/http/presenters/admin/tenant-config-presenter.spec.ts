import { makeTenant } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { TenantConfigPresenter } from './tenant-config-presenter'

describe('TenantConfigPresenter', () => {
  it('serializa o tenant para o formato HTTP', () => {
    const tenant = makeTenant({
      id: 'tenant-1',
      nome: 'Fazenda X',
      status: 'ativo',
      labelArea: 'Gleba',
      diaCorteConsolidacao: 10,
    })

    const out = TenantConfigPresenter.toHTTP(tenant)

    expect(out).toEqual({
      id: 'tenant-1',
      nome: 'Fazenda X',
      status: 'ativo',
      labelArea: 'Gleba',
      diaCorteConsolidacao: 10,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    })
  })

  it('preserva diaCorteConsolidacao null', () => {
    const tenant = makeTenant({ diaCorteConsolidacao: null })

    expect(TenantConfigPresenter.toHTTP(tenant).diaCorteConsolidacao).toBeNull()
  })
})
