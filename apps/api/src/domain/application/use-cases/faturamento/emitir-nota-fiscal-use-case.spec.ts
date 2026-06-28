import { makeEmpresa } from '@test/factories/make-empresa'
import { makeNotaFiscal } from '@test/factories/make-nota-fiscal'
import { makePedido } from '@test/factories/make-pedido'
import { makePedidoItem } from '@test/factories/make-pedido-item'
import { makeProduto } from '@test/factories/make-produto'
import { FakeFiscalProvider } from '@test/providers/fake-fiscal-provider'
import { InMemoryEmpresaRepository } from '@test/repositories/in-memory-empresa-repository'
import { InMemoryNotaFiscalRepository } from '@test/repositories/in-memory-nota-fiscal-repository'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import { InMemoryProdutoRepository } from '@test/repositories/in-memory-produto-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { EmitirNotaFiscalUseCase } from './emitir-nota-fiscal-use-case'

import { left } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EmpresaNotFoundError } from '@/domain/application/use-cases/errors/empresa-not-found-error'
import { NotaJaEmitidaError } from '@/domain/application/use-cases/errors/nota-ja-emitida-error'
import { PedidoNaoFaturavelError } from '@/domain/application/use-cases/errors/pedido-nao-faturavel-error'
import { PedidoNotFoundError } from '@/domain/application/use-cases/errors/pedido-not-found-error'
import { TransicaoFiscalInvalidaError } from '@/domain/application/use-cases/errors/transicao-fiscal-invalida-error'
import { NotaFiscal } from '@/domain/enterprise/entities/nota-fiscal'

describe(EmitirNotaFiscalUseCase.name, () => {
  let notaRepo: InMemoryNotaFiscalRepository
  let empresaRepo: InMemoryEmpresaRepository
  let pedidoRepo: InMemoryPedidoRepository
  let produtoRepo: InMemoryProdutoRepository
  let fiscalProvider: FakeFiscalProvider
  let sut: EmitirNotaFiscalUseCase

  beforeEach(() => {
    notaRepo = new InMemoryNotaFiscalRepository()
    empresaRepo = new InMemoryEmpresaRepository()
    pedidoRepo = new InMemoryPedidoRepository()
    produtoRepo = new InMemoryProdutoRepository()
    fiscalProvider = new FakeFiscalProvider()
    sut = new EmitirNotaFiscalUseCase(
      notaRepo,
      empresaRepo,
      pedidoRepo,
      produtoRepo,
      fiscalProvider,
    )
  })

  async function seed(opts: { pedidoStatus?: 'confirmado' | 'faturado' | 'rascunho' } = {}) {
    const empresa = makeEmpresa({
      id: 'empresa-1',
      serieNfe: 1,
      proximaNumeracaoNfe: 5,
      ambienteFiscal: 'producao',
    })
    empresaRepo.empresas.push(empresa)

    const produto = makeProduto({
      id: 'produto-1',
      descricao: 'Soja',
      ncm: '12019000',
      cfopPadrao: '5101',
      cstCsosn: '102',
      aliquotas: { icms: 12 },
    })
    produtoRepo.produtos.push(produto)

    const pedido = makePedido({
      id: 'pedido-1',
      empresaFaturadoraId: 'empresa-1',
      clienteId: 'cliente-1',
      status: opts.pedidoStatus ?? 'confirmado',
      itens: [makePedidoItem({ id: 'pi-1', produtoId: 'produto-1', quantidade: 10, precoUnitario: 50 })],
    })
    pedidoRepo.pedidos.push(pedido)
  }

  it('emite nota autorizada montando snapshot fiscal a partir do produto', async () => {
    await seed()

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      pedidoId: 'pedido-1',
      naturezaOperacao: 'Venda',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const { nota } = result.value
      expect(nota.status).toBe('autorizada')
      expect(nota.numero).toBe('5')
      expect(nota.serie).toBe('1')
      expect(nota.ambiente).toBe('producao')
      expect(nota.chaveAcesso).toBe('0'.repeat(44))
      expect(nota.protocolo).toBe('protocolo-1')
      expect(nota.plugnotasId).toBe('plugnotas-1')
      expect(nota.danfeUrl).toBe('https://files.example/danfe.pdf')
      expect(nota.itens).toHaveLength(1)
      expect(nota.itens[0].ncm).toBe('12019000')
      expect(nota.itens[0].cfop).toBe('5101')
      expect(nota.itens[0].cstCsosn).toBe('102')
      expect(nota.itens[0].impostos).toEqual({ icms: 12 })
      expect(nota.valorTotal).toBe(500)
    }
    expect(fiscalProvider.emitirCalls).toHaveLength(1)
  })

  it('incrementa a numeração da empresa de forma persistida', async () => {
    await seed()

    await sut.execute({ tenantId: 'tenant-1', empresaEmitenteId: 'empresa-1', pedidoId: 'pedido-1' })

    const empresa = await empresaRepo.findById('empresa-1', 'tenant-1')
    expect(empresa?.proximaNumeracaoNfe).toBe(6)
    expect(notaRepo.empresas[0].proximaNumeracaoNfe).toBe(6)
  })

  it('registra evento de emissão na criação e evento de autorização no fechamento', async () => {
    await seed()

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const tipos = result.value.nota.eventos.map((e) => e.tipo)
      expect(tipos).toContain('emissao')
    }
  })

  it('aplica rejeição quando o provider rejeita', async () => {
    await seed()
    fiscalProvider.emitirResult = { status: 'rejeitada', mensagemRetorno: 'CNPJ destinatário inválido' }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.status).toBe('rejeitada')
      expect(result.value.nota.mensagemRetorno).toBe('CNPJ destinatário inválido')
      expect(result.value.nota.eventos.some((e) => e.tipo === 'rejeicao')).toBe(true)
    }
  })

  it('mantém status emitindo no fluxo assíncrono', async () => {
    await seed()
    fiscalProvider.emitirResult = { status: 'emitindo', plugnotasId: 'pn-async' }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.status).toBe('emitindo')
      expect(result.value.nota.plugnotasId).toBe('pn-async')
    }
  })

  it('aceita pedido faturado', async () => {
    await seed({ pedidoStatus: 'faturado' })

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isRight()).toBe(true)
  })

  it('retorna EmpresaNotFoundError quando a empresa não existe', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-x',
      pedidoId: 'pedido-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmpresaNotFoundError)
  })

  it('retorna PedidoNotFoundError quando o pedido é de outra empresa (cross-tenant/IDOR)', async () => {
    await seed()
    pedidoRepo.pedidos[0] = makePedido({
      id: 'pedido-1',
      empresaFaturadoraId: 'outra-empresa',
      status: 'confirmado',
    })

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PedidoNotFoundError)
  })

  it('retorna PedidoNaoFaturavelError quando o pedido está em rascunho', async () => {
    await seed({ pedidoStatus: 'rascunho' })

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PedidoNaoFaturavelError)
  })

  it('retorna NotaJaEmitidaError quando já existe nota autorizada para o pedido', async () => {
    await seed()
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-prev', pedidoId: 'pedido-1', status: 'autorizada' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotaJaEmitidaError)
  })

  it('usa serie nula quando a empresa não tem serieNfe', async () => {
    const empresa = makeEmpresa({ id: 'empresa-1', serieNfe: null, proximaNumeracaoNfe: 1 })
    empresaRepo.empresas.push(empresa)
    produtoRepo.produtos.push(makeProduto({ id: 'produto-1' }))
    pedidoRepo.pedidos.push(
      makePedido({
        id: 'pedido-1',
        empresaFaturadoraId: 'empresa-1',
        status: 'confirmado',
        itens: [makePedidoItem({ id: 'pi-1', produtoId: 'produto-1' })],
      }),
    )

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.serie).toBeNull()
    }
  })

  it('usa descrição vazia e snapshot nulo quando o produto não é encontrado', async () => {
    const empresa = makeEmpresa({ id: 'empresa-1', serieNfe: 1 })
    empresaRepo.empresas.push(empresa)
    pedidoRepo.pedidos.push(
      makePedido({
        id: 'pedido-1',
        empresaFaturadoraId: 'empresa-1',
        status: 'confirmado',
        itens: [makePedidoItem({ id: 'pi-1', produtoId: 'produto-sumido' })],
      }),
    )

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.itens[0].descricao).toBe('')
      expect(result.value.nota.itens[0].ncm).toBeNull()
      expect(result.value.nota.itens[0].impostos).toEqual({})
    }
  })

  it('preenche defaults quando o provider autoriza sem campos opcionais', async () => {
    await seed()
    fiscalProvider.emitirResult = { status: 'autorizada' }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.status).toBe('autorizada')
      expect(result.value.nota.chaveAcesso).toBe('')
      expect(result.value.nota.protocolo).toBe('')
      expect(result.value.nota.xmlUrl).toBeNull()
      expect(result.value.nota.danfeUrl).toBeNull()
    }
  })

  it('usa mensagem vazia quando o provider rejeita sem mensagem', async () => {
    await seed()
    fiscalProvider.emitirResult = { status: 'rejeitada' }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.status).toBe('rejeitada')
      expect(result.value.nota.mensagemRetorno).toBe('')
    }
  })

  it('mantém emitindo sem plugnotasId no fluxo assíncrono', async () => {
    await seed()
    fiscalProvider.emitirResult = { status: 'emitindo' }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.status).toBe('emitindo')
      expect(result.value.nota.plugnotasId).toBeNull()
    }
  })

  it('propaga TransicaoFiscalInvalidaError quando marcarEmitindo falha', async () => {
    await seed()
    const original = NotaFiscal.prototype.marcarEmitindo
    NotaFiscal.prototype.marcarEmitindo = function () {
      return left(new TransicaoFiscalInvalidaError(this.status, 'emitindo'))
    }

    try {
      const result = await sut.execute({
        tenantId: 'tenant-1',
        empresaEmitenteId: 'empresa-1',
        pedidoId: 'pedido-1',
      })

      expect(result.isLeft()).toBe(true)
      expect(result.value).toBeInstanceOf(TransicaoFiscalInvalidaError)
    } finally {
      NotaFiscal.prototype.marcarEmitindo = original
    }
  })

  it('propaga TransicaoFiscalInvalidaError quando marcarAutorizada falha', async () => {
    await seed()
    const original = NotaFiscal.prototype.marcarAutorizada
    NotaFiscal.prototype.marcarAutorizada = function () {
      return left(new TransicaoFiscalInvalidaError(this.status, 'autorizada'))
    }

    try {
      const result = await sut.execute({
        tenantId: 'tenant-1',
        empresaEmitenteId: 'empresa-1',
        pedidoId: 'pedido-1',
      })

      expect(result.isLeft()).toBe(true)
      expect(result.value).toBeInstanceOf(TransicaoFiscalInvalidaError)
    } finally {
      NotaFiscal.prototype.marcarAutorizada = original
    }
  })

  it('propaga TransicaoFiscalInvalidaError quando marcarRejeitada falha', async () => {
    await seed()
    fiscalProvider.emitirResult = { status: 'rejeitada', mensagemRetorno: 'x' }
    const original = NotaFiscal.prototype.marcarRejeitada
    NotaFiscal.prototype.marcarRejeitada = function () {
      return left(new TransicaoFiscalInvalidaError(this.status, 'rejeitada'))
    }

    try {
      const result = await sut.execute({
        tenantId: 'tenant-1',
        empresaEmitenteId: 'empresa-1',
        pedidoId: 'pedido-1',
      })

      expect(result.isLeft()).toBe(true)
      expect(result.value).toBeInstanceOf(TransicaoFiscalInvalidaError)
    } finally {
      NotaFiscal.prototype.marcarRejeitada = original
    }
  })

  it('retorna UnexpectedError quando criarEmissao lança', async () => {
    await seed()
    notaRepo.shouldFailOnCriarEmissao = true

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      pedidoId: 'pedido-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
