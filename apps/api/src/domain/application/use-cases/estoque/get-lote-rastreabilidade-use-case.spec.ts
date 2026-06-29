import { makeColheita } from '@test/factories/make-colheita'
import { makeLote } from '@test/factories/make-lote'
import { makePedido } from '@test/factories/make-pedido'
import { makePedidoItem } from '@test/factories/make-pedido-item'
import { makeRemessa } from '@test/factories/make-remessa'
import { makeRemessaItem } from '@test/factories/make-remessa-item'
import { InMemoryColheitaRepository } from '@test/repositories/in-memory-colheita-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import { InMemoryRemessaRepository } from '@test/repositories/in-memory-remessa-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GetLoteRastreabilidadeUseCase } from './get-lote-rastreabilidade-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { LoteNotFoundError } from '@/domain/application/use-cases/errors/lote-not-found-error'

describe(GetLoteRastreabilidadeUseCase.name, () => {
  let loteRepo: InMemoryLoteRepository
  let colheitaRepo: InMemoryColheitaRepository
  let pedidoRepo: InMemoryPedidoRepository
  let remessaRepo: InMemoryRemessaRepository
  let sut: GetLoteRastreabilidadeUseCase

  beforeEach(() => {
    loteRepo = new InMemoryLoteRepository()
    colheitaRepo = new InMemoryColheitaRepository()
    pedidoRepo = new InMemoryPedidoRepository()
    remessaRepo = new InMemoryRemessaRepository()
    sut = new GetLoteRastreabilidadeUseCase(loteRepo, colheitaRepo, pedidoRepo, remessaRepo)
  })

  it('retorna lote com cadeia a montante a partir da colheita', async () => {
    colheitaRepo.colheitas.push(
      makeColheita({ id: 'colheita-1', safraId: 'safra-1', areaId: 'area-1' }),
    )
    loteRepo.lotes.push(makeLote({ id: 'lote-1', colheitaId: 'colheita-1', areaId: null }))

    const result = await sut.execute({ tenantId: 'tenant-1', loteId: 'lote-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.lote.id.toString()).toBe('lote-1')
      expect(result.value.montante.colheita?.id.toString()).toBe('colheita-1')
      expect(result.value.montante.safraId).toBe('safra-1')
      expect(result.value.montante.areaId).toBe('area-1')
      expect(result.value.jusante.pedidoItens).toEqual([])
      expect(result.value.jusante.remessaItens).toEqual([])
    }
  })

  it('popula jusante com pedidos e remessas que consumiram o lote', async () => {
    loteRepo.lotes.push(makeLote({ id: 'lote-1' }))
    pedidoRepo.clienteNomes['cliente-1'] = 'Atacadão Verde'
    remessaRepo.clienteNomes['cliente-1'] = 'Atacadão Verde'

    pedidoRepo.pedidos.push(
      makePedido({
        id: 'pedido-1',
        numero: '000007',
        clienteId: 'cliente-1',
        data: new Date('2024-10-05'),
        status: 'confirmado',
        itens: [makePedidoItem({ id: 'pi-1', pedidoId: 'pedido-1', loteId: 'lote-1', quantidade: 30 })],
      }),
    )
    remessaRepo.remessas.push(
      makeRemessa({
        id: 'remessa-1',
        numero: '000003',
        clienteId: 'cliente-1',
        data: new Date('2024-10-06'),
        status: 'entregue',
        itens: [
          makeRemessaItem({ id: 'ri-1', remessaId: 'remessa-1', loteId: 'lote-1', quantidade: 12 }),
        ],
      }),
    )

    const result = await sut.execute({ tenantId: 'tenant-1', loteId: 'lote-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.jusante.pedidoItens).toHaveLength(1)
      expect(result.value.jusante.pedidoItens[0]).toMatchObject({
        pedidoId: 'pedido-1',
        numero: '000007',
        clienteId: 'cliente-1',
        clienteNome: 'Atacadão Verde',
        quantidade: 30,
        status: 'confirmado',
      })
      expect(result.value.jusante.remessaItens).toHaveLength(1)
      expect(result.value.jusante.remessaItens[0]).toMatchObject({
        remessaId: 'remessa-1',
        numero: '000003',
        clienteNome: 'Atacadão Verde',
        quantidade: 12,
        status: 'entregue',
      })
    }
  })

  it('retorna jusante vazio quando o lote não foi consumido por nenhum documento', async () => {
    loteRepo.lotes.push(makeLote({ id: 'lote-1' }))
    pedidoRepo.pedidos.push(
      makePedido({
        id: 'pedido-1',
        itens: [makePedidoItem({ id: 'pi-1', pedidoId: 'pedido-1', loteId: 'outro-lote' })],
      }),
    )

    const result = await sut.execute({ tenantId: 'tenant-1', loteId: 'lote-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.jusante.pedidoItens).toEqual([])
      expect(result.value.jusante.remessaItens).toEqual([])
    }
  })

  it('não vaza consumo de outro tenant no jusante', async () => {
    loteRepo.lotes.push(makeLote({ id: 'lote-1', tenantId: 'tenant-1' }))
    pedidoRepo.pedidos.push(
      makePedido({
        id: 'pedido-x',
        tenantId: 'tenant-2',
        itens: [
          makePedidoItem({ id: 'pi-x', tenantId: 'tenant-2', pedidoId: 'pedido-x', loteId: 'lote-1' }),
        ],
      }),
    )
    remessaRepo.remessas.push(
      makeRemessa({
        id: 'remessa-x',
        tenantId: 'tenant-2',
        itens: [
          makeRemessaItem({
            id: 'ri-x',
            tenantId: 'tenant-2',
            remessaId: 'remessa-x',
            loteId: 'lote-1',
          }),
        ],
      }),
    )

    const result = await sut.execute({ tenantId: 'tenant-1', loteId: 'lote-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.jusante.pedidoItens).toEqual([])
      expect(result.value.jusante.remessaItens).toEqual([])
    }
  })

  it('usa areaId do lote quando não há colheita vinculada', async () => {
    loteRepo.lotes.push(
      makeLote({ id: 'lote-1', origemTipo: 'embalagem', colheitaId: null, areaId: 'area-2' }),
    )

    const result = await sut.execute({ tenantId: 'tenant-1', loteId: 'lote-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.montante.colheita).toBeNull()
      expect(result.value.montante.safraId).toBeNull()
      expect(result.value.montante.areaId).toBe('area-2')
    }
  })

  it('retorna LoteNotFound quando o lote não existe', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', loteId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(LoteNotFoundError)
  })

  it('isola lote por tenant (cross-tenant retorna LoteNotFound)', async () => {
    loteRepo.lotes.push(makeLote({ id: 'lote-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', loteId: 'lote-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(LoteNotFoundError)
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(loteRepo, 'findById').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({ tenantId: 'tenant-1', loteId: 'lote-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
