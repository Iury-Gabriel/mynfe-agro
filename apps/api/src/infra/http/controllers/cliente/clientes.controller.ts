import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { z } from 'zod'

import { CreateClienteUseCase } from '@/domain/application/use-cases/clientes/create-cliente-use-case'
import { DeleteClienteUseCase } from '@/domain/application/use-cases/clientes/delete-cliente-use-case'
import { ListClientesUseCase } from '@/domain/application/use-cases/clientes/list-clientes-use-case'
import { UpdateClienteUseCase } from '@/domain/application/use-cases/clientes/update-cliente-use-case'
import { ClienteNotFoundError } from '@/domain/application/use-cases/errors/cliente-not-found-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'
import { INDICADORES_IE, TIPOS_PESSOA_CLIENTE } from '@/domain/enterprise/entities/cliente'
import { CurrentUser, type SessionUser } from '@/infra/http/decorators/current-user.decorator'
import { RequiresPermission } from '@/infra/http/decorators/requires-permission.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'
import { ClientePresenter } from '@/infra/http/presenters/cliente/cliente-presenter'

const enderecoEntregaSchema = z
  .object({
    enderecoLogradouro: z.string().max(200).nullish(),
    enderecoNumero: z.string().max(20).nullish(),
    enderecoBairro: z.string().max(100).nullish(),
    enderecoCep: z.string().max(9).nullish(),
    municipio: z.string().max(100).nullish(),
    uf: z.string().length(2).nullish(),
    principal: z.boolean().optional(),
  })
  .strict()

const listClientesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
})

const createClienteBodySchema = z
  .object({
    tipoPessoa: z.enum(TIPOS_PESSOA_CLIENTE),
    razaoSocialNome: z.string().min(1).max(200),
    cnpjCpf: z.string().min(11).max(18),
    inscricaoEstadual: z.string().max(30).nullish(),
    indicadorIe: z.enum(INDICADORES_IE),
    contribuinteIcms: z.boolean(),
    enderecoLogradouro: z.string().max(200).nullish(),
    enderecoNumero: z.string().max(20).nullish(),
    enderecoBairro: z.string().max(100).nullish(),
    enderecoCep: z.string().max(9).nullish(),
    municipio: z.string().max(100).nullish(),
    codMunicipioIbge: z.string().max(10).nullish(),
    uf: z.string().length(2).nullish(),
    email: z.string().email().max(200).nullish(),
    telefone: z.string().max(30).nullish(),
    vendedorUsuarioId: z.string().max(60).nullish(),
    enderecosEntrega: z.array(enderecoEntregaSchema).optional(),
  })
  .strict()

const updateClienteBodySchema = z
  .object({
    tipoPessoa: z.enum(TIPOS_PESSOA_CLIENTE).optional(),
    razaoSocialNome: z.string().min(1).max(200).optional(),
    cnpjCpf: z.string().min(11).max(18).optional(),
    inscricaoEstadual: z.string().max(30).nullish(),
    indicadorIe: z.enum(INDICADORES_IE).optional(),
    contribuinteIcms: z.boolean().optional(),
    enderecoLogradouro: z.string().max(200).nullish(),
    enderecoNumero: z.string().max(20).nullish(),
    enderecoBairro: z.string().max(100).nullish(),
    enderecoCep: z.string().max(9).nullish(),
    municipio: z.string().max(100).nullish(),
    codMunicipioIbge: z.string().max(10).nullish(),
    uf: z.string().length(2).nullish(),
    email: z.string().email().max(200).nullish(),
    telefone: z.string().max(30).nullish(),
    vendedorUsuarioId: z.string().max(60).nullish(),
  })
  .strict()

@Controller('clientes')
export class ClientesController {
  constructor(
    private readonly listClientes: ListClientesUseCase,
    private readonly createCliente: CreateClienteUseCase,
    private readonly updateCliente: UpdateClienteUseCase,
    private readonly deleteCliente: DeleteClienteUseCase,
  ) {}

  private requireTenant(user: SessionUser): string {
    if (!user.tenantId) throw CustomHttpException.forbidden()
    return user.tenantId
  }

  @Get()
  @RequiresPermission('cliente:read')
  async list(
    @Query(new ZodValidationPipe(listClientesQuerySchema)) query: z.infer<typeof listClientesQuerySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.listClientes.execute({
      tenantId,
      page: query.page,
      perPage: query.perPage,
    })
    if (result.isLeft()) throw CustomHttpException.fromUseCaseError(result.value)

    const { items, total, page, perPage, totalPages } = result.value
    return {
      clientes: items.map((cliente) => ClientePresenter.toHTTP(cliente)),
      total,
      page,
      perPage,
      totalPages,
    }
  }

  @Post()
  @RequiresPermission('cliente:create')
  async create(
    @Body(new ZodValidationPipe(createClienteBodySchema)) body: z.infer<typeof createClienteBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.createCliente.execute({
      tenantId,
      tipoPessoa: body.tipoPessoa,
      razaoSocialNome: body.razaoSocialNome,
      cnpjCpf: body.cnpjCpf,
      inscricaoEstadual: body.inscricaoEstadual,
      indicadorIe: body.indicadorIe,
      contribuinteIcms: body.contribuinteIcms,
      enderecoLogradouro: body.enderecoLogradouro,
      enderecoNumero: body.enderecoNumero,
      enderecoBairro: body.enderecoBairro,
      enderecoCep: body.enderecoCep,
      municipio: body.municipio,
      codMunicipioIbge: body.codMunicipioIbge,
      uf: body.uf,
      email: body.email,
      telefone: body.telefone,
      vendedorUsuarioId: body.vendedorUsuarioId,
      enderecosEntrega: body.enderecosEntrega,
    })
    if (result.isLeft()) {
      if (result.value instanceof InvalidCnpjCpfError) {
        throw new CustomHttpException('InvalidCnpjCpf', result.value.message, 400)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { cliente: ClientePresenter.toHTTP(result.value.cliente) }
  }

  @Patch(':id')
  @RequiresPermission('cliente:update')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateClienteBodySchema)) body: z.infer<typeof updateClienteBodySchema>,
    @CurrentUser() user: SessionUser,
  ) {
    const tenantId = this.requireTenant(user)
    const result = await this.updateCliente.execute({
      tenantId,
      clienteId: id,
      tipoPessoa: body.tipoPessoa,
      razaoSocialNome: body.razaoSocialNome,
      cnpjCpf: body.cnpjCpf,
      inscricaoEstadual: body.inscricaoEstadual,
      indicadorIe: body.indicadorIe,
      contribuinteIcms: body.contribuinteIcms,
      enderecoLogradouro: body.enderecoLogradouro,
      enderecoNumero: body.enderecoNumero,
      enderecoBairro: body.enderecoBairro,
      enderecoCep: body.enderecoCep,
      municipio: body.municipio,
      codMunicipioIbge: body.codMunicipioIbge,
      uf: body.uf,
      email: body.email,
      telefone: body.telefone,
      vendedorUsuarioId: body.vendedorUsuarioId,
    })
    if (result.isLeft()) {
      if (result.value instanceof ClienteNotFoundError) {
        throw new CustomHttpException('ClienteNotFound', result.value.message, 404)
      }
      if (result.value instanceof InvalidCnpjCpfError) {
        throw new CustomHttpException('InvalidCnpjCpf', result.value.message, 400)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { cliente: ClientePresenter.toHTTP(result.value.cliente) }
  }

  @Delete(':id')
  @RequiresPermission('cliente:delete')
  async remove(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const tenantId = this.requireTenant(user)
    const result = await this.deleteCliente.execute({ tenantId, clienteId: id })
    if (result.isLeft()) {
      if (result.value instanceof ClienteNotFoundError) {
        throw new CustomHttpException('ClienteNotFound', result.value.message, 404)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }
    return { cliente: ClientePresenter.toHTTP(result.value.cliente) }
  }
}
