import { describe, expect, it } from 'vitest'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { EstoqueInsuficienteError } from '@/domain/application/use-cases/errors/estoque-insuficiente-error'
import { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'

function makeSut(disponivel = 1000, reservada = 0) {
  return EstoqueSaldo.create(
    {
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      produtoId: 'produto-1',
      quantidadeDisponivel: disponivel,
      quantidadeReservada: reservada,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    new UniqueEntityID('saldo-1'),
  )
}

describe(EstoqueSaldo.name, () => {
  it('cria com defaults zerados e loteId nulo', () => {
    const sut = EstoqueSaldo.create({
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      produtoId: 'produto-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.quantidadeDisponivel).toBe(0)
    expect(sut.quantidadeReservada).toBe(0)
    expect(sut.loteId).toBeNull()
  })

  it('preserva loteId quando informado', () => {
    const sut = EstoqueSaldo.create({
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      produtoId: 'produto-1',
      loteId: 'lote-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.loteId).toBe('lote-1')
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.empresaId).toBe('empresa-1')
    expect(sut.produtoId).toBe('produto-1')
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-01'))
  })

  it('aplica entrada somando ao disponível', () => {
    const sut = makeSut()

    sut.aplicarEntrada(500)

    expect(sut.quantidadeDisponivel).toBe(1500)
  })

  it('aplica saída dentro do disponível', () => {
    const sut = makeSut()

    const result = sut.aplicarSaida(400)

    expect(result.isRight()).toBe(true)
    expect(sut.quantidadeDisponivel).toBe(600)
  })

  it('rejeita saída acima do disponível', () => {
    const sut = makeSut(100)

    const result = sut.aplicarSaida(400)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EstoqueInsuficienteError)
    expect(sut.quantidadeDisponivel).toBe(100)
  })

  it('aplica ajuste positivo', () => {
    const sut = makeSut(100)

    const result = sut.aplicarAjuste(50)

    expect(result.isRight()).toBe(true)
    expect(sut.quantidadeDisponivel).toBe(150)
  })

  it('aplica ajuste negativo dentro do disponível', () => {
    const sut = makeSut(100)

    const result = sut.aplicarAjuste(-40)

    expect(result.isRight()).toBe(true)
    expect(sut.quantidadeDisponivel).toBe(60)
  })

  it('rejeita ajuste que deixaria disponível negativo', () => {
    const sut = makeSut(30)

    const result = sut.aplicarAjuste(-50)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EstoqueInsuficienteError)
    expect(sut.quantidadeDisponivel).toBe(30)
  })

  it('reserva movendo de disponível para reservada', () => {
    const sut = makeSut(100)

    const result = sut.reservar(40)

    expect(result.isRight()).toBe(true)
    expect(sut.quantidadeDisponivel).toBe(60)
    expect(sut.quantidadeReservada).toBe(40)
  })

  it('rejeita reserva acima do disponível', () => {
    const sut = makeSut(30)

    const result = sut.reservar(50)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EstoqueInsuficienteError)
    expect(sut.quantidadeDisponivel).toBe(30)
    expect(sut.quantidadeReservada).toBe(0)
  })

  it('libera reserva movendo de reservada para disponível', () => {
    const sut = makeSut(60, 40)

    const result = sut.liberarReserva(40)

    expect(result.isRight()).toBe(true)
    expect(sut.quantidadeReservada).toBe(0)
    expect(sut.quantidadeDisponivel).toBe(100)
  })

  it('rejeita liberação acima do reservado', () => {
    const sut = makeSut(60, 10)

    const result = sut.liberarReserva(40)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EstoqueInsuficienteError)
    expect(sut.quantidadeReservada).toBe(10)
    expect(sut.quantidadeDisponivel).toBe(60)
  })
})
