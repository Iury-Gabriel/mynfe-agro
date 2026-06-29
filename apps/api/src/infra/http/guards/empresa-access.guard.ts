import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { ACTIVE_EMPRESA_HEADER } from '../decorators/current-empresa.decorator'
import { REQUIRES_EMPRESA_KEY } from '../decorators/requires-empresa.decorator'
import { CustomHttpException } from '../exceptions/custom-http.exception'

import type { SessionUser } from '../decorators/current-user.decorator'
import type { Request } from 'express'

import { PrismaService } from '@/infra/database/prisma/prisma.service'

@Injectable()
export class EmpresaAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean | undefined>(REQUIRES_EMPRESA_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])
    if (!required) return true

    const req = ctx.switchToHttp().getRequest<Request & { user?: SessionUser }>()
    if (!req.user) throw CustomHttpException.unauthorized()
    if (!req.user.tenantId) throw CustomHttpException.forbidden()

    const headerRaw = req.headers[ACTIVE_EMPRESA_HEADER]
    const empresaId = Array.isArray(headerRaw) ? headerRaw[0] : headerRaw
    if (typeof empresaId !== 'string' || empresaId.trim().length === 0) {
      throw CustomHttpException.badRequest(`Header ${ACTIVE_EMPRESA_HEADER} obrigatório.`)
    }

    const link = await this.prisma.usuarioEmpresa.findFirst({
      where: {
        userId: req.user.id,
        empresaId,
        empresa: { tenantId: req.user.tenantId, deletedAt: null },
      },
      select: { empresaId: true },
    })
    if (!link) throw CustomHttpException.forbidden()

    return true
  }
}
