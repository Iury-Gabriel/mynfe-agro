import { makeAuditoriaLog } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { AuditoriaLogPresenter } from './auditoria-log-presenter'

describe('AuditoriaLogPresenter', () => {
  it('serializa o log para o formato HTTP', () => {
    const log = makeAuditoriaLog({
      id: 'log-1',
      usuarioId: 'user-1',
      entidade: 'tenant',
      entidadeId: 'tenant-1',
      acao: 'editar',
      dadosAntes: { nome: 'Antes' },
      dadosDepois: { nome: 'Depois' },
    })

    const out = AuditoriaLogPresenter.toHTTP(log)

    expect(out).toEqual({
      id: 'log-1',
      tenantId: 'tenant-1',
      usuarioId: 'user-1',
      entidade: 'tenant',
      entidadeId: 'tenant-1',
      acao: 'editar',
      dadosAntes: { nome: 'Antes' },
      dadosDepois: { nome: 'Depois' },
      data: log.data,
    })
  })

  it('preserva usuarioId e JSONs nulos', () => {
    const log = makeAuditoriaLog({ usuarioId: null, dadosAntes: null, dadosDepois: null })

    const out = AuditoriaLogPresenter.toHTTP(log)

    expect(out.usuarioId).toBeNull()
    expect(out.dadosAntes).toBeNull()
    expect(out.dadosDepois).toBeNull()
  })
})
