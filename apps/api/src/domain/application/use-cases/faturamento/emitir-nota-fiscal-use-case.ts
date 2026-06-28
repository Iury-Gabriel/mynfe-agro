import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { FiscalProvider, type FiscalEmitirItem } from '@/domain/application/ports/fiscal-provider'
import { EmpresaRepository } from '@/domain/application/repositories/empresa-repository'
import { NotaFiscalRepository } from '@/domain/application/repositories/nota-fiscal-repository'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { EmpresaNotFoundError } from '@/domain/application/use-cases/errors/empresa-not-found-error'
import { NotaJaEmitidaError } from '@/domain/application/use-cases/errors/nota-ja-emitida-error'
import { PedidoNaoFaturavelError } from '@/domain/application/use-cases/errors/pedido-nao-faturavel-error'
import { PedidoNotFoundError } from '@/domain/application/use-cases/errors/pedido-not-found-error'
import { TransicaoFiscalInvalidaError } from '@/domain/application/use-cases/errors/transicao-fiscal-invalida-error'
import { NotaFiscal } from '@/domain/enterprise/entities/nota-fiscal'
import { NotaFiscalEvento } from '@/domain/enterprise/entities/nota-fiscal-evento'
import { NotaFiscalItem } from '@/domain/enterprise/entities/nota-fiscal-item'

export interface EmitirNotaFiscalInput {
  tenantId: string
  empresaEmitenteId: string
  pedidoId: string
  naturezaOperacao?: string | null
}

export interface EmitirNotaFiscalOutput {
  nota: NotaFiscal
}

type EmitirNotaFiscalResult = Either<
  | EmpresaNotFoundError
  | PedidoNotFoundError
  | PedidoNaoFaturavelError
  | NotaJaEmitidaError
  | TransicaoFiscalInvalidaError
  | UnexpectedError,
  EmitirNotaFiscalOutput
>

const STATUSES_BLOQUEIO = new Set(['autorizada', 'emitindo'])

@Injectable()
export class EmitirNotaFiscalUseCase {
  constructor(
    private readonly notas: NotaFiscalRepository,
    private readonly empresas: EmpresaRepository,
    private readonly pedidos: PedidoRepository,
    private readonly produtos: ProdutoRepository,
    private readonly fiscalProvider: FiscalProvider,
    private readonly registrarAuditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(input: EmitirNotaFiscalInput): Promise<EmitirNotaFiscalResult> {
    try {
      const empresa = await this.empresas.findById(input.empresaEmitenteId, input.tenantId)
      if (empresa === null) {
        return left(new EmpresaNotFoundError())
      }

      const pedido = await this.pedidos.findById(input.pedidoId, input.tenantId)
      if (pedido?.empresaFaturadoraId !== input.empresaEmitenteId) {
        return left(new PedidoNotFoundError())
      }

      if (pedido.status !== 'confirmado' && pedido.status !== 'faturado') {
        return left(new PedidoNaoFaturavelError())
      }

      const existentes = await this.notas.findAtivasByPedido(input.tenantId, pedido.id.toString())
      if (existentes.some((nota) => STATUSES_BLOQUEIO.has(nota.status))) {
        return left(new NotaJaEmitidaError())
      }

      const now = new Date()
      const numero = empresa.reservarNumeracaoNfe()

      const nota = NotaFiscal.create({
        tenantId: input.tenantId,
        empresaEmitenteId: input.empresaEmitenteId,
        pedidoId: pedido.id.toString(),
        clienteId: pedido.clienteId,
        numero: String(numero),
        serie: empresa.serieNfe === null ? null : String(empresa.serieNfe),
        naturezaOperacao: input.naturezaOperacao ?? null,
        ambiente: empresa.ambienteFiscal,
        createdAt: now,
        updatedAt: now,
      })

      for (const item of pedido.itens) {
        const produto = await this.produtos.findById(item.produtoId, input.tenantId)
        nota.addItem(
          NotaFiscalItem.create({
            tenantId: input.tenantId,
            notaFiscalId: nota.id.toString(),
            produtoId: item.produtoId,
            descricao: produto?.descricao ?? '',
            ncm: produto?.ncm ?? null,
            cfop: produto?.cfopPadrao ?? null,
            cstCsosn: produto?.cstCsosn ?? null,
            quantidade: item.quantidade,
            valorUnitario: item.precoUnitario,
            valorTotal: item.valorTotal,
            impostos: produto?.aliquotas ?? {},
            createdAt: now,
            updatedAt: now,
          }),
        )
      }

      const emitindoResult = nota.marcarEmitindo()
      if (emitindoResult.isLeft()) {
        return left(emitindoResult.value)
      }

      const eventoEmissao = NotaFiscalEvento.create({
        tenantId: input.tenantId,
        notaFiscalId: nota.id.toString(),
        tipo: 'emissao',
        payload: { numero: nota.numero, serie: nota.serie },
        data: now,
      })
      nota.addEvento(eventoEmissao)

      await this.notas.criarEmissao({ nota, empresa })

      const resultado = await this.fiscalProvider.emitir({
        notaFiscalId: nota.id.toString(),
        empresaEmitenteId: nota.empresaEmitenteId,
        clienteId: nota.clienteId,
        numero: String(numero),
        serie: nota.serie,
        modelo: nota.modelo,
        naturezaOperacao: nota.naturezaOperacao,
        valorTotal: nota.valorTotal,
        ambiente: nota.ambiente,
        itens: this.mapItens(nota),
      })

      const aplicacao = this.aplicarResultado(input.tenantId, nota, resultado, now)
      if (aplicacao.isLeft()) {
        return left(aplicacao.value)
      }

      await this.notas.atualizarStatusComEvento({ nota, evento: aplicacao.value })

      await this.registrarAuditoria.execute({
        tenantId: input.tenantId,
        entidade: 'nota_fiscal',
        entidadeId: nota.id.toString(),
        acao: 'emitir',
        dadosDepois: {
          pedidoId: nota.pedidoId,
          empresaEmitenteId: nota.empresaEmitenteId,
          numero: nota.numero,
          serie: nota.serie,
          status: nota.status,
        },
      })

      return right({ nota })
    } catch (err) {
      console.error('[EmitirNotaFiscalUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }

  private mapItens(nota: NotaFiscal): FiscalEmitirItem[] {
    return nota.itens.map((item) => ({
      produtoId: item.produtoId,
      descricao: item.descricao,
      ncm: item.ncm,
      cfop: item.cfop,
      cstCsosn: item.cstCsosn,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      valorTotal: item.valorTotal,
      impostos: item.impostos,
    }))
  }

  private aplicarResultado(
    tenantId: string,
    nota: NotaFiscal,
    resultado: Awaited<ReturnType<FiscalProvider['emitir']>>,
    ref: Date,
  ): Either<TransicaoFiscalInvalidaError, NotaFiscalEvento> {
    if (resultado.status === 'autorizada') {
      const transicao = nota.marcarAutorizada({
        chaveAcesso: resultado.chaveAcesso ?? '',
        protocolo: resultado.protocolo ?? '',
        plugnotasId: resultado.plugnotasId ?? null,
        xmlUrl: resultado.xmlUrl ?? null,
        danfeUrl: resultado.danfeUrl ?? null,
        dataEmissao: ref,
      })
      if (transicao.isLeft()) {
        return left(transicao.value)
      }
      return right(
        NotaFiscalEvento.create({
          tenantId,
          notaFiscalId: nota.id.toString(),
          tipo: 'emissao',
          payload: {
            status: 'autorizada',
            chaveAcesso: resultado.chaveAcesso ?? null,
            protocolo: resultado.protocolo ?? null,
          },
          data: ref,
        }),
      )
    }

    if (resultado.status === 'rejeitada') {
      const transicao = nota.marcarRejeitada(resultado.mensagemRetorno ?? '')
      if (transicao.isLeft()) {
        return left(transicao.value)
      }
      return right(
        NotaFiscalEvento.create({
          tenantId,
          notaFiscalId: nota.id.toString(),
          tipo: 'rejeicao',
          payload: { mensagemRetorno: resultado.mensagemRetorno ?? null },
          data: ref,
        }),
      )
    }

    nota.registrarPlugnotasId(resultado.plugnotasId ?? null)
    return right(
      NotaFiscalEvento.create({
        tenantId,
        notaFiscalId: nota.id.toString(),
        tipo: 'emissao',
        payload: { status: 'emitindo', plugnotasId: resultado.plugnotasId ?? null },
        data: ref,
      }),
    )
  }
}
