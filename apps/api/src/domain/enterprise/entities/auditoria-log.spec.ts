import { describe, expect, it } from 'vitest'

import { AuditoriaLog, type AuditoriaLogProps } from './auditoria-log'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'

function makeProps(override: Partial<AuditoriaLogProps> = {}): AuditoriaLogProps {
  return {
    tenantId: 'tenant-1',
    usuarioId: 'user-1',
    entidade: 'tenant',
    entidadeId: 'tenant-1',
    acao: 'editar',
    dadosAntes: { nome: 'Antes' },
    dadosDepois: { nome: 'Depois' },
    data: new Date('2024-01-01'),
    ...override,
  }
}

describe(AuditoriaLog.name, () => {
  it('cria com id gerado e expõe todos os getters', () => {
    const props = makeProps()
    const sut = AuditoriaLog.create(props)

    expect(sut.id).toBeInstanceOf(UniqueEntityID)
    expect(sut.tenantId).toBe(props.tenantId)
    expect(sut.usuarioId).toBe(props.usuarioId)
    expect(sut.entidade).toBe(props.entidade)
    expect(sut.entidadeId).toBe(props.entidadeId)
    expect(sut.acao).toBe('editar')
    expect(sut.dadosAntes).toEqual(props.dadosAntes)
    expect(sut.dadosDepois).toEqual(props.dadosDepois)
    expect(sut.data).toBe(props.data)
  })

  it('aceita id explícito', () => {
    const id = new UniqueEntityID('log-1')
    const sut = AuditoriaLog.create(makeProps(), id)

    expect(sut.id).toBe(id)
  })

  it('aplica defaults de usuarioId, dadosAntes, dadosDepois e data quando omitidos', () => {
    const sut = AuditoriaLog.create({
      tenantId: 'tenant-1',
      entidade: 'produto',
      entidadeId: 'p1',
      acao: 'criar',
    })

    expect(sut.usuarioId).toBeNull()
    expect(sut.dadosAntes).toBeNull()
    expect(sut.dadosDepois).toBeNull()
    expect(sut.data).toBeInstanceOf(Date)
  })

  it('aceita usuarioId, dadosAntes e dadosDepois explicitamente nulos', () => {
    const sut = AuditoriaLog.create(
      makeProps({ usuarioId: null, dadosAntes: null, dadosDepois: null }),
    )

    expect(sut.usuarioId).toBeNull()
    expect(sut.dadosAntes).toBeNull()
    expect(sut.dadosDepois).toBeNull()
  })
})
