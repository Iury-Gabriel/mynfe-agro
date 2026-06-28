import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { FiscalProvider } from '@/domain/application/ports/fiscal-provider'
import { NotaFiscalRepository } from '@/domain/application/repositories/nota-fiscal-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { NotaFiscalNotFoundError } from '@/domain/application/use-cases/errors/nota-fiscal-not-found-error'
import { TransicaoFiscalInvalidaError } from '@/domain/application/use-cases/errors/transicao-fiscal-invalida-error'
import { NotaFiscal } from '@/domain/enterprise/entities/nota-fiscal'
import { NotaFiscalEvento } from '@/domain/enterprise/entities/nota-fiscal-evento'

export interface CancelarNotaFiscalInput {
  tenantId: string
  empresaEmitenteId: string
  notaFiscalId: string
  motivo?: string | null
}

export interface CancelarNotaFiscalOutput {
  nota: NotaFiscal
}

type CancelarNotaFiscalResult = Either<
  NotaFiscalNotFoundError | TransicaoFiscalInvalidaError | UnexpectedError,
  CancelarNotaFiscalOutput
>

@Injectable()
export class CancelarNotaFiscalUseCase {
  constructor(
    private readonly notas: NotaFiscalRepository,
    private readonly fiscalProvider: FiscalProvider,
    private readonly registrarAuditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(input: CancelarNotaFiscalInput): Promise<CancelarNotaFiscalResult> {
    try {
      const nota = await this.notas.findById(input.notaFiscalId, input.tenantId)

      if (nota?.empresaEmitenteId !== input.empresaEmitenteId) {
        return left(new NotaFiscalNotFoundError())
      }

      if (nota.status !== 'autorizada') {
        return left(new TransicaoFiscalInvalidaError(nota.status, 'cancelada'))
      }

      const statusAntes = nota.status
      const now = new Date()
      const resultado = await this.fiscalProvider.cancelar(nota.plugnotasId ?? '')

      if (resultado.status === 'rejeitada') {
        const evento = NotaFiscalEvento.create({
          tenantId: input.tenantId,
          notaFiscalId: nota.id.toString(),
          tipo: 'rejeicao',
          payload: { acao: 'cancelamento', mensagemRetorno: resultado.mensagemRetorno ?? null },
          data: now,
        })
        await this.notas.atualizarStatusComEvento({ nota, evento })

        await this.registrarAuditoria.execute({
          tenantId: input.tenantId,
          entidade: 'nota_fiscal',
          entidadeId: nota.id.toString(),
          acao: 'editar',
          dadosAntes: { status: statusAntes },
          dadosDepois: { status: nota.status, cancelamento: 'rejeitado' },
        })

        return right({ nota })
      }

      const transicao = nota.marcarCancelada()
      if (transicao.isLeft()) {
        return left(transicao.value)
      }

      const evento = NotaFiscalEvento.create({
        tenantId: input.tenantId,
        notaFiscalId: nota.id.toString(),
        tipo: 'cancelamento',
        payload: { motivo: input.motivo ?? null },
        data: now,
      })
      await this.notas.atualizarStatusComEvento({ nota, evento })

      await this.registrarAuditoria.execute({
        tenantId: input.tenantId,
        entidade: 'nota_fiscal',
        entidadeId: nota.id.toString(),
        acao: 'editar',
        dadosAntes: { status: statusAntes },
        dadosDepois: { status: nota.status, motivo: input.motivo ?? null },
      })

      return right({ nota })
    } catch (err) {
      console.error('[CancelarNotaFiscalUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
