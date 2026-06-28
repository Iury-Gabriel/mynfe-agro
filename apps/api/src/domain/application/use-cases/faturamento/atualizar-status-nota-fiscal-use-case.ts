import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { FiscalProvider } from '@/domain/application/ports/fiscal-provider'
import { NotaFiscalRepository } from '@/domain/application/repositories/nota-fiscal-repository'
import { NotaFiscalNotFoundError } from '@/domain/application/use-cases/errors/nota-fiscal-not-found-error'
import { TransicaoFiscalInvalidaError } from '@/domain/application/use-cases/errors/transicao-fiscal-invalida-error'
import { NotaFiscal } from '@/domain/enterprise/entities/nota-fiscal'
import { NotaFiscalEvento } from '@/domain/enterprise/entities/nota-fiscal-evento'

export interface AtualizarStatusNotaFiscalInput {
  tenantId: string
  plugnotasId: string
}

export interface AtualizarStatusNotaFiscalOutput {
  nota: NotaFiscal
}

type AtualizarStatusNotaFiscalResult = Either<
  NotaFiscalNotFoundError | TransicaoFiscalInvalidaError | UnexpectedError,
  AtualizarStatusNotaFiscalOutput
>

@Injectable()
export class AtualizarStatusNotaFiscalUseCase {
  constructor(
    private readonly notas: NotaFiscalRepository,
    private readonly fiscalProvider: FiscalProvider,
  ) {}

  async execute(
    input: AtualizarStatusNotaFiscalInput,
  ): Promise<AtualizarStatusNotaFiscalResult> {
    try {
      const nota = await this.notas.findByPlugnotasId(input.plugnotasId, input.tenantId)
      if (nota === null) {
        return left(new NotaFiscalNotFoundError())
      }

      const resultado = await this.fiscalProvider.consultar(input.plugnotasId)
      const now = new Date()

      if (resultado.status === 'autorizada') {
        const transicao = nota.marcarAutorizada({
          chaveAcesso: resultado.chaveAcesso ?? '',
          protocolo: resultado.protocolo ?? '',
          plugnotasId: resultado.plugnotasId ?? input.plugnotasId,
          xmlUrl: resultado.xmlUrl ?? null,
          danfeUrl: resultado.danfeUrl ?? null,
          dataEmissao: now,
        })
        if (transicao.isLeft()) {
          return left(transicao.value)
        }
        const evento = NotaFiscalEvento.create({
          tenantId: input.tenantId,
          notaFiscalId: nota.id.toString(),
          tipo: 'emissao',
          payload: { status: 'autorizada', protocolo: resultado.protocolo ?? null },
          data: now,
        })
        await this.notas.atualizarStatusComEvento({ nota, evento })
        return right({ nota })
      }

      if (resultado.status === 'rejeitada') {
        const transicao = nota.marcarRejeitada(resultado.mensagemRetorno ?? '')
        if (transicao.isLeft()) {
          return left(transicao.value)
        }
        const evento = NotaFiscalEvento.create({
          tenantId: input.tenantId,
          notaFiscalId: nota.id.toString(),
          tipo: 'rejeicao',
          payload: { mensagemRetorno: resultado.mensagemRetorno ?? null },
          data: now,
        })
        await this.notas.atualizarStatusComEvento({ nota, evento })
        return right({ nota })
      }

      return right({ nota })
    } catch (err) {
      console.error('[AtualizarStatusNotaFiscalUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
