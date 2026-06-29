import { Body, Controller, Post } from '@nestjs/common'
import { z } from 'zod'

import { EmailAlreadyInUseError } from '@/domain/application/use-cases/errors/email-already-in-use-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'
import { RegisterTenantUseCase } from '@/domain/application/use-cases/tenants/register-tenant-use-case'
import { AMBIENTES_FISCAIS, TIPOS_PESSOA } from '@/domain/enterprise/entities/empresa'
import { Public } from '@/infra/http/decorators/public.decorator'
import { CustomHttpException } from '@/infra/http/exceptions/custom-http.exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation.pipe'

const empresaSchema = z
  .object({
    razaoSocial: z.string().min(1).max(200),
    cnpjCpf: z.string().min(11).max(18),
    tipoPessoa: z.enum(TIPOS_PESSOA),
    regimeTributario: z.string().min(1).max(50),
    crt: z.string().min(1).max(10),
    ambienteFiscal: z.enum(AMBIENTES_FISCAIS).optional(),
  })
  .strict()

const registerBodySchema = z
  .object({
    name: z.string().min(1).max(200),
    email: z.string().email().max(200),
    password: z.string().min(12).max(128),
    tenantNome: z.string().min(1).max(200),
    empresa: empresaSchema,
  })
  .strict()

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly registerTenant: RegisterTenantUseCase) {}

  @Post('register')
  @Public()
  async register(
    @Body(new ZodValidationPipe(registerBodySchema)) body: z.infer<typeof registerBodySchema>,
  ) {
    const result = await this.registerTenant.execute({
      name: body.name,
      email: body.email,
      password: body.password,
      tenantNome: body.tenantNome,
      empresa: {
        razaoSocial: body.empresa.razaoSocial,
        cnpjCpf: body.empresa.cnpjCpf,
        tipoPessoa: body.empresa.tipoPessoa,
        regimeTributario: body.empresa.regimeTributario,
        crt: body.empresa.crt,
        ambienteFiscal: body.empresa.ambienteFiscal,
      },
    })

    if (result.isLeft()) {
      if (result.value instanceof EmailAlreadyInUseError) {
        throw new CustomHttpException('EmailAlreadyInUse', result.value.message, 409)
      }
      if (result.value instanceof InvalidCnpjCpfError) {
        throw new CustomHttpException('InvalidCnpjCpf', result.value.message, 400)
      }
      throw CustomHttpException.fromUseCaseError(result.value)
    }

    return {
      user: { id: result.value.user.id.toString(), email: result.value.user.email },
    }
  }
}
