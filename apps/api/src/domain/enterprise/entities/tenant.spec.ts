import { describe, expect, it } from 'vitest'

import { Tenant, type TenantProps } from './tenant'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'

function makeTenantProps(override: Partial<TenantProps> = {}): TenantProps {
  return {
    nome: 'Fazenda São João',
    status: 'ativo',
    labelArea: 'Talhão',
    diaCorteConsolidacao: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe(Tenant.name, () => {
  it('cria com id gerado e expõe todos os getters', () => {
    const props = makeTenantProps()
    const sut = Tenant.create(props)

    expect(sut.id).toBeInstanceOf(UniqueEntityID)
    expect(sut.nome).toBe(props.nome)
    expect(sut.status).toBe('ativo')
    expect(sut.labelArea).toBe(props.labelArea)
    expect(sut.diaCorteConsolidacao).toBe(props.diaCorteConsolidacao)
    expect(sut.createdAt).toBe(props.createdAt)
    expect(sut.updatedAt).toBe(props.updatedAt)
    expect(sut.deletedAt).toBeNull()
  })

  it('aceita id explícito', () => {
    const id = new UniqueEntityID('tenant-1')
    const sut = Tenant.create(makeTenantProps(), id)

    expect(sut.id).toBe(id)
  })

  it('aplica defaults de status, diaCorteConsolidacao e deletedAt quando omitidos', () => {
    const sut = Tenant.create({
      nome: 'Fazenda Nova',
      labelArea: 'Lote',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.status).toBe('ativo')
    expect(sut.diaCorteConsolidacao).toBeNull()
    expect(sut.deletedAt).toBeNull()
  })

  it('aceita status, diaCorteConsolidacao e deletedAt explícitos', () => {
    const deletedAt = new Date('2024-02-01')
    const sut = Tenant.create(
      makeTenantProps({ status: 'suspenso', diaCorteConsolidacao: 10, deletedAt }),
    )

    expect(sut.status).toBe('suspenso')
    expect(sut.diaCorteConsolidacao).toBe(10)
    expect(sut.deletedAt).toBe(deletedAt)
  })

  describe('rename()', () => {
    it('atualiza o nome e o updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Tenant.create(makeTenantProps({ updatedAt: before }))

      sut.rename('Fazenda Renomeada')

      expect(sut.nome).toBe('Fazenda Renomeada')
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('setLabelArea()', () => {
    it('atualiza o label da área e o updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Tenant.create(makeTenantProps({ labelArea: 'Talhão', updatedAt: before }))

      sut.setLabelArea('Quadra')

      expect(sut.labelArea).toBe('Quadra')
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('suspend()', () => {
    it('define status suspenso e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Tenant.create(makeTenantProps({ status: 'ativo', updatedAt: before }))

      sut.suspend()

      expect(sut.status).toBe('suspenso')
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('activate()', () => {
    it('define status ativo e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Tenant.create(makeTenantProps({ status: 'suspenso', updatedAt: before }))

      sut.activate()

      expect(sut.status).toBe('ativo')
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('deactivate()', () => {
    it('define status inativo e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Tenant.create(makeTenantProps({ status: 'ativo', updatedAt: before }))

      sut.deactivate()

      expect(sut.status).toBe('inativo')
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })
})
