import { describe, expect, it } from 'vitest'

import { Produto } from './produto'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'

function makeProdutoFull() {
  return Produto.create({
    tenantId: 'tenant-1',
    empresaId: 'empresa-1',
    descricao: 'Soja',
    tipo: 'bruto',
    unidadeMedida: 'KG',
    precoPadrao: 10,
    ncm: '12019000',
    cest: '0100100',
    cfopPadrao: '5101',
    origemMercadoria: '0',
    cstCsosn: '102',
    aliquotas: { icms: 12 },
    status: 'ativo',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
  })
}

describe(Produto.name, () => {
  it('cria com id gerado e expõe todos os getters', () => {
    const sut = makeProdutoFull()

    expect(sut.id).toBeInstanceOf(UniqueEntityID)
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.empresaId).toBe('empresa-1')
    expect(sut.descricao).toBe('Soja')
    expect(sut.tipo).toBe('bruto')
    expect(sut.unidadeMedida).toBe('KG')
    expect(sut.precoPadrao).toBe(10)
    expect(sut.ncm).toBe('12019000')
    expect(sut.cest).toBe('0100100')
    expect(sut.cfopPadrao).toBe('5101')
    expect(sut.origemMercadoria).toBe('0')
    expect(sut.cstCsosn).toBe('102')
    expect(sut.aliquotas).toEqual({ icms: 12 })
    expect(sut.status).toBe('ativo')
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-02'))
    expect(sut.deletedAt).toBeNull()
  })

  it('aceita id explícito', () => {
    const id = new UniqueEntityID('produto-1')
    const sut = Produto.create(
      {
        tenantId: 'tenant-1',
        empresaId: 'empresa-1',
        descricao: 'Milho',
        tipo: 'embalado',
        unidadeMedida: 'SC',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      id,
    )

    expect(sut.id).toBe(id)
  })

  it('aplica defaults para campos opcionais quando omitidos', () => {
    const sut = Produto.create({
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      descricao: 'Milho',
      tipo: 'embalado',
      unidadeMedida: 'SC',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.precoPadrao).toBeNull()
    expect(sut.ncm).toBeNull()
    expect(sut.cest).toBeNull()
    expect(sut.cfopPadrao).toBeNull()
    expect(sut.origemMercadoria).toBeNull()
    expect(sut.cstCsosn).toBeNull()
    expect(sut.aliquotas).toBeNull()
    expect(sut.status).toBe('ativo')
    expect(sut.deletedAt).toBeNull()
  })

  describe('activate()', () => {
    it('define status ativo e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Produto.create({
        tenantId: 'tenant-1',
        empresaId: 'empresa-1',
        descricao: 'Soja',
        tipo: 'bruto',
        unidadeMedida: 'KG',
        status: 'inativo',
        createdAt: before,
        updatedAt: before,
      })

      sut.activate()

      expect(sut.status).toBe('ativo')
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('deactivate()', () => {
    it('define status inativo e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Produto.create({
        tenantId: 'tenant-1',
        empresaId: 'empresa-1',
        descricao: 'Soja',
        tipo: 'bruto',
        unidadeMedida: 'KG',
        status: 'ativo',
        createdAt: before,
        updatedAt: before,
      })

      sut.deactivate()

      expect(sut.status).toBe('inativo')
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('updateCadastro()', () => {
    it('atualiza todos os campos quando informados', () => {
      const sut = makeProdutoFull()

      sut.updateCadastro({
        descricao: 'Soja Premium',
        tipo: 'embalado',
        unidadeMedida: 'SC',
        precoPadrao: 99,
        ncm: '99999999',
        cest: '0200200',
        cfopPadrao: '6101',
        origemMercadoria: '1',
        cstCsosn: '500',
        aliquotas: { icms: 18 },
      })

      expect(sut.descricao).toBe('Soja Premium')
      expect(sut.tipo).toBe('embalado')
      expect(sut.unidadeMedida).toBe('SC')
      expect(sut.precoPadrao).toBe(99)
      expect(sut.ncm).toBe('99999999')
      expect(sut.cest).toBe('0200200')
      expect(sut.cfopPadrao).toBe('6101')
      expect(sut.origemMercadoria).toBe('1')
      expect(sut.cstCsosn).toBe('500')
      expect(sut.aliquotas).toEqual({ icms: 18 })
    })

    it('aceita campos opcionais como null', () => {
      const sut = makeProdutoFull()

      sut.updateCadastro({
        precoPadrao: null,
        ncm: null,
        cest: null,
        cfopPadrao: null,
        origemMercadoria: null,
        cstCsosn: null,
        aliquotas: null,
      })

      expect(sut.precoPadrao).toBeNull()
      expect(sut.ncm).toBeNull()
      expect(sut.cest).toBeNull()
      expect(sut.cfopPadrao).toBeNull()
      expect(sut.origemMercadoria).toBeNull()
      expect(sut.cstCsosn).toBeNull()
      expect(sut.aliquotas).toBeNull()
    })

    it('mantém campos não informados intactos', () => {
      const sut = makeProdutoFull()

      sut.updateCadastro({ descricao: 'Só descrição' })

      expect(sut.descricao).toBe('Só descrição')
      expect(sut.tipo).toBe('bruto')
      expect(sut.unidadeMedida).toBe('KG')
      expect(sut.precoPadrao).toBe(10)
      expect(sut.ncm).toBe('12019000')
    })

    it('atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Produto.create({
        tenantId: 'tenant-1',
        empresaId: 'empresa-1',
        descricao: 'Soja',
        tipo: 'bruto',
        unidadeMedida: 'KG',
        createdAt: before,
        updatedAt: before,
      })

      sut.updateCadastro({ descricao: 'Nova' })

      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })
})
