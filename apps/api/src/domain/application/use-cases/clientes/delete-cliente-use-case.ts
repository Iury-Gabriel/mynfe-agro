import { Injectable } from '@nestjs/common'

import type { Cliente } from '@/domain/enterprise/entities/cliente'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ClienteRepository } from '@/domain/application/repositories/cliente-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { ClienteNotFoundError } from '@/domain/application/use-cases/errors/cliente-not-found-error'

export interface DeleteClienteInput {
  tenantId: string
  clienteId: string
}

export interface DeleteClienteOutput {
  cliente: Cliente
}

type DeleteClienteResult = Either<ClienteNotFoundError | UnexpectedError, DeleteClienteOutput>

@Injectable()
export class DeleteClienteUseCase {
  constructor(
    private readonly clientes: ClienteRepository,
    private readonly registrarAuditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(input: DeleteClienteInput): Promise<DeleteClienteResult> {
    const cliente = await this.clientes.findById(input.clienteId, input.tenantId)
    if (!cliente) return left(new ClienteNotFoundError())

    const dadosAntes = {
      razaoSocialNome: cliente.razaoSocialNome,
      deletedAt: cliente.deletedAt,
    }

    cliente.delete()

    try {
      await this.clientes.save(cliente)
    } catch (err) {
      console.error('[DeleteClienteUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    await this.registrarAuditoria.execute({
      tenantId: cliente.tenantId,
      entidade: 'cliente',
      entidadeId: cliente.id.toString(),
      acao: 'excluir',
      dadosAntes,
      dadosDepois: { deletedAt: cliente.deletedAt },
    })

    return right({ cliente })
  }
}
