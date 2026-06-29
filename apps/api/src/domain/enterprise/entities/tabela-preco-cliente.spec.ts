import { describe, expect, it } from 'vitest'

import { TabelaPrecoCliente } from './tabela-preco-cliente'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'

function makeTabela(
  overrides: {
    vigenciaInicio?: Date | null
    vigenciaFim?: Date | null
  } = {},
) {
  return TabelaPrecoCliente.create({
    tenantId: 'tenant-1',
    clienteId: 'cliente-1',
    produtoId: 'produto-1',
    preco: 100,
    vigenciaInicio: overrides.vigenciaInicio ?? null,
    vigenciaFim: overrides.vigenciaFim ?? null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
  })
}

describe(TabelaPrecoCliente.name, () => {
  it('cria com id gerado e expõe todos os getters', () => {
    const sut = TabelaPrecoCliente.create({
      tenantId: 'tenant-1',
      clienteId: 'cliente-1',
      produtoId: 'produto-1',
      preco: 100,
      vigenciaInicio: new Date('2024-01-01'),
      vigenciaFim: new Date('2024-12-31'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      deletedAt: null,
    })

    expect(sut.id).toBeInstanceOf(UniqueEntityID)
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.clienteId).toBe('cliente-1')
    expect(sut.produtoId).toBe('produto-1')
    expect(sut.preco).toBe(100)
    expect(sut.vigenciaInicio).toEqual(new Date('2024-01-01'))
    expect(sut.vigenciaFim).toEqual(new Date('2024-12-31'))
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-02'))
    expect(sut.deletedAt).toBeNull()
  })

  it('aceita id explícito', () => {
    const id = new UniqueEntityID('tabela-preco-1')
    const sut = TabelaPrecoCliente.create(
      {
        tenantId: 'tenant-1',
        clienteId: 'cliente-1',
        produtoId: 'produto-1',
        preco: 50,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      id,
    )

    expect(sut.id).toBe(id)
  })

  it('aplica defaults de vigência e deletedAt quando omitidos', () => {
    const sut = TabelaPrecoCliente.create({
      tenantId: 'tenant-1',
      clienteId: 'cliente-1',
      produtoId: 'produto-1',
      preco: 50,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.vigenciaInicio).toBeNull()
    expect(sut.vigenciaFim).toBeNull()
    expect(sut.deletedAt).toBeNull()
  })

  describe('isVigente()', () => {
    const ref = new Date('2024-06-15')

    it('retorna true quando ambas as vigências são nulas (aberto)', () => {
      const sut = makeTabela()

      expect(sut.isVigente(ref)).toBe(true)
    })

    it('retorna true quando ref está dentro do intervalo', () => {
      const sut = makeTabela({
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFim: new Date('2024-12-31'),
      })

      expect(sut.isVigente(ref)).toBe(true)
    })

    it('trata vigenciaInicio nula como aberto à esquerda', () => {
      const sut = makeTabela({ vigenciaFim: new Date('2024-12-31') })

      expect(sut.isVigente(ref)).toBe(true)
    })

    it('trata vigenciaFim nula como aberto à direita', () => {
      const sut = makeTabela({ vigenciaInicio: new Date('2024-01-01') })

      expect(sut.isVigente(ref)).toBe(true)
    })

    it('retorna false quando ref é anterior ao início', () => {
      const sut = makeTabela({ vigenciaInicio: new Date('2024-07-01') })

      expect(sut.isVigente(ref)).toBe(false)
    })

    it('retorna false quando ref é posterior ao fim', () => {
      const sut = makeTabela({ vigenciaFim: new Date('2024-05-01') })

      expect(sut.isVigente(ref)).toBe(false)
    })

    it('retorna true nas bordas do intervalo (inclusivo)', () => {
      const sut = makeTabela({
        vigenciaInicio: new Date('2024-06-15'),
        vigenciaFim: new Date('2024-06-15'),
      })

      expect(sut.isVigente(ref)).toBe(true)
    })
  })

  describe('update()', () => {
    it('atualiza todos os campos quando informados', () => {
      const sut = makeTabela()

      sut.update({
        preco: 200,
        vigenciaInicio: new Date('2025-01-01'),
        vigenciaFim: new Date('2025-12-31'),
      })

      expect(sut.preco).toBe(200)
      expect(sut.vigenciaInicio).toEqual(new Date('2025-01-01'))
      expect(sut.vigenciaFim).toEqual(new Date('2025-12-31'))
    })

    it('aceita vigências como null', () => {
      const sut = makeTabela({
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFim: new Date('2024-12-31'),
      })

      sut.update({ vigenciaInicio: null, vigenciaFim: null })

      expect(sut.vigenciaInicio).toBeNull()
      expect(sut.vigenciaFim).toBeNull()
    })

    it('mantém campos não informados intactos', () => {
      const sut = makeTabela({ vigenciaInicio: new Date('2024-01-01') })

      sut.update({ preco: 300 })

      expect(sut.preco).toBe(300)
      expect(sut.vigenciaInicio).toEqual(new Date('2024-01-01'))
    })

    it('atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = TabelaPrecoCliente.create({
        tenantId: 'tenant-1',
        clienteId: 'cliente-1',
        produtoId: 'produto-1',
        preco: 50,
        createdAt: before,
        updatedAt: before,
      })

      sut.update({ preco: 60 })

      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('markAsDeleted()', () => {
    it('define deletedAt e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = TabelaPrecoCliente.create({
        tenantId: 'tenant-1',
        clienteId: 'cliente-1',
        produtoId: 'produto-1',
        preco: 50,
        createdAt: before,
        updatedAt: before,
      })

      sut.markAsDeleted()

      expect(sut.deletedAt).toBeInstanceOf(Date)
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })
})
