import { describe, expect, it } from 'vitest'

import { ProdutoFichaTecnica } from './produto-ficha-tecnica'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'

function makeFichaFull() {
  return ProdutoFichaTecnica.create({
    tenantId: 'tenant-1',
    produtoId: 'produto-1',
    descricaoComponente: 'Milho moído',
    quantidadeReferencia: 5,
    observacoes: 'Mistura base',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
  })
}

describe(ProdutoFichaTecnica.name, () => {
  it('cria com id gerado e expõe todos os getters', () => {
    const sut = makeFichaFull()

    expect(sut.id).toBeInstanceOf(UniqueEntityID)
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.produtoId).toBe('produto-1')
    expect(sut.descricaoComponente).toBe('Milho moído')
    expect(sut.quantidadeReferencia).toBe(5)
    expect(sut.observacoes).toBe('Mistura base')
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-02'))
    expect(sut.deletedAt).toBeNull()
  })

  it('aceita id explícito', () => {
    const id = new UniqueEntityID('ficha-1')
    const sut = ProdutoFichaTecnica.create(
      {
        tenantId: 'tenant-1',
        produtoId: 'produto-1',
        descricaoComponente: 'Soja',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      id,
    )

    expect(sut.id).toBe(id)
  })

  it('aplica defaults para campos opcionais quando omitidos', () => {
    const sut = ProdutoFichaTecnica.create({
      tenantId: 'tenant-1',
      produtoId: 'produto-1',
      descricaoComponente: 'Soja',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.quantidadeReferencia).toBeNull()
    expect(sut.observacoes).toBeNull()
    expect(sut.deletedAt).toBeNull()
  })

  describe('update()', () => {
    it('atualiza todos os campos quando informados', () => {
      const sut = makeFichaFull()

      sut.update({
        descricaoComponente: 'Soja moída',
        quantidadeReferencia: 9,
        observacoes: 'Atualizado',
      })

      expect(sut.descricaoComponente).toBe('Soja moída')
      expect(sut.quantidadeReferencia).toBe(9)
      expect(sut.observacoes).toBe('Atualizado')
    })

    it('aceita campos opcionais como null', () => {
      const sut = makeFichaFull()

      sut.update({ quantidadeReferencia: null, observacoes: null })

      expect(sut.quantidadeReferencia).toBeNull()
      expect(sut.observacoes).toBeNull()
    })

    it('mantém campos não informados intactos', () => {
      const sut = makeFichaFull()

      sut.update({ descricaoComponente: 'Novo nome' })

      expect(sut.descricaoComponente).toBe('Novo nome')
      expect(sut.quantidadeReferencia).toBe(5)
      expect(sut.observacoes).toBe('Mistura base')
    })

    it('atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = ProdutoFichaTecnica.create({
        tenantId: 'tenant-1',
        produtoId: 'produto-1',
        descricaoComponente: 'Soja',
        createdAt: before,
        updatedAt: before,
      })

      sut.update({ descricaoComponente: 'Nova' })

      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })
})
