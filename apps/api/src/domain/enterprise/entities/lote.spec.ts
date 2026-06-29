import { describe, expect, it } from 'vitest'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { EstoqueInsuficienteError } from '@/domain/application/use-cases/errors/estoque-insuficiente-error'
import { Lote } from '@/domain/enterprise/entities/lote'

function makeSut() {
  return Lote.create(
    {
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      produtoId: 'produto-1',
      codigoLote: 'LOTE-001',
      quantidadeInicial: 1000,
      quantidadeAtual: 1000,
      dataEntrada: new Date('2024-10-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    new UniqueEntityID('lote-1'),
  )
}

describe(Lote.name, () => {
  it('cria com defaults para campos opcionais', () => {
    const sut = makeSut()

    expect(sut.codigoLote).toBe('LOTE-001')
    expect(sut.quantidadeInicial).toBe(1000)
    expect(sut.quantidadeAtual).toBe(1000)
    expect(sut.origemTipo).toBeNull()
    expect(sut.colheitaId).toBeNull()
    expect(sut.areaId).toBeNull()
    expect(sut.validade).toBeNull()
    expect(sut.deletedAt).toBeNull()
    expect(sut.dataEntrada).toEqual(new Date('2024-10-01'))
  })

  it('preserva campos opcionais quando informados', () => {
    const sut = Lote.create({
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      produtoId: 'produto-1',
      codigoLote: 'LOTE-002',
      origemTipo: 'colheita',
      colheitaId: 'colheita-1',
      areaId: 'area-1',
      quantidadeInicial: 500,
      quantidadeAtual: 500,
      validade: new Date('2025-01-01'),
      dataEntrada: new Date('2024-10-01'),
      deletedAt: new Date('2024-12-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.empresaId).toBe('empresa-1')
    expect(sut.produtoId).toBe('produto-1')
    expect(sut.origemTipo).toBe('colheita')
    expect(sut.colheitaId).toBe('colheita-1')
    expect(sut.areaId).toBe('area-1')
    expect(sut.validade).toEqual(new Date('2025-01-01'))
    expect(sut.deletedAt).toEqual(new Date('2024-12-01'))
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-01'))
  })

  it('consome quantidade dentro do disponível', () => {
    const sut = makeSut()

    const result = sut.consumir(300)

    expect(result.isRight()).toBe(true)
    expect(sut.quantidadeAtual).toBe(700)
    expect(sut.updatedAt.getTime()).toBeGreaterThan(new Date('2024-01-01').getTime())
  })

  it('rejeita consumo acima do disponível mantendo a quantidade', () => {
    const sut = makeSut()

    const result = sut.consumir(1500)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EstoqueInsuficienteError)
    expect(sut.quantidadeAtual).toBe(1000)
  })

  it('estorna quantidade somando ao disponível', () => {
    const sut = makeSut()

    sut.estornar(200)

    expect(sut.quantidadeAtual).toBe(1200)
  })

  it('soft delete marca deletedAt', () => {
    const sut = makeSut()

    sut.softDelete()

    expect(sut.deletedAt).toBeInstanceOf(Date)
  })
})
